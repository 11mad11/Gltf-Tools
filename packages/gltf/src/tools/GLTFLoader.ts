import { PropertyBinding } from "three";
import { GLTFParserExtension } from "./GLTFParserExtension";
import { PendingGroup } from "./PendingGroup";

const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

export interface GLTFLoaderCtx {
    ressourceBaseURL: URL,
    extensions: (new (parser: GLTFParser) => GLTFParserExtension)[]
}

export class GLTFLoader {

    private extensions: (new (parser: GLTFParser) => GLTFParserExtension)[] = []

    constructor() {

    }

    register<T extends GLTFParserExtension>(t: new (parser: GLTFParser) => T) {
        this.extensions.push(t);
    }

    async load(url: URL, ressourcePath: string = ".", fetchOpt?: RequestInit) {
        const ctx: GLTFLoaderCtx = {
            ressourceBaseURL: new URL(ressourcePath, url),
            extensions: this.extensions
        }

        return this.parseBinary(await (await fetch(url, fetchOpt)).arrayBuffer(), ctx)
    }

    parseBinary(buff: ArrayBuffer, ctx: Partial<GLTFLoaderCtx> = {}) {
        const headerView = new DataView(buff, 0, BINARY_EXTENSION_HEADER_LENGTH);
        const textDecoder = new TextDecoder();
        const header = {
            magic: textDecoder.decode(new Uint8Array(buff.slice(0, 4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true)
        };

        if (header.magic !== BINARY_EXTENSION_HEADER_MAGIC)
            return this.parseJSON(JSON.parse(textDecoder.decode(buff)), ctx)
        else if (header.version < 2.0)
            throw new Error('GLTFLoader: Legacy binary file detected.');

        const parser = new GLTFParser(Object.assign({
            extensions: this.extensions,
            ressourceBaseURL: new URL(import.meta.url)
        }, ctx));

        const chunkContentsLength = header.length - BINARY_EXTENSION_HEADER_LENGTH;
        const chunkView = new DataView(buff, BINARY_EXTENSION_HEADER_LENGTH);
        let chunkIndex = 0;

        while (chunkIndex < chunkContentsLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;
            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                const contentArray = new Uint8Array(buff, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
                parser.json = JSON.parse(textDecoder.decode(contentArray));
            } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                parser.setBuffer(0, buff.slice(byteOffset, byteOffset + chunkLength));
            }

            // Clients must ignore chunks with unknown types.
            chunkIndex += chunkLength;
        }

        if (parser.json === null)
            throw new Error('GLTFLoader: JSON content not found.');

        return parser.parse();
    }

    parseJSON(json: any, ctx: Partial<GLTFLoaderCtx> = {}) {
        if (json.asset === undefined || json.asset.version[0] < 2) {
            throw new Error('GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.');
        }
        const parser = new GLTFParser(Object.assign({
            extensions: this.extensions,
            ressourceBaseURL: new URL(import.meta.url)
        }, ctx));
        parser.json = json;
        return parser.parse();
    }
}

export type GLTFPointer = {
    index: number,
    raw: any,
    type: string
} | null
export type GLTFResolvedPointer<T> = {
    index: number,
    raw: any,
    type: string,
    value: T
}

export class GLTFParser {

    private nodeNamesUsed: Record<string, number> = {};
    private extensions = new Map<(new (parser: GLTFParser) => GLTFParserExtension), GLTFParserExtension>()
    private buffers: (Promise<ArrayBuffer>)[] = [];
    public json: any = null
    public readonly pending = new PendingGroup();

    public events = {
        preparse: [] as (() => void | Promise<void>)[],
        parse: [] as (() => void | Promise<void>)[],
        postparse: [] as (() => void | Promise<void>)[],
    }

    constructor(
        public ctx: GLTFLoaderCtx
    ) {
        for (const extention of ctx.extensions) {
            const instance = new extention(this);
            this.extensions.set(extention, instance);
        }
        for (const extention of ctx.extensions) {
            GLTFParserExtension.init(this.extensions.get(extention));
        }
    }

    getExtension<T extends GLTFParserExtension>(t: new (...args: any[]) => T): T {
        return this.extensions.get(t) as any;
    }

    async invokeAll<F extends ((...args: any[]) => void | Promise<void>)>(fns: F[], ...args: Parameters<F>) {
        for (const fn of fns) {
            await fn(...args);
        }
    }

    async invokeOne<F extends ((...args: any[]) => any | Promise<any>)>(fns: F[], ...args: Parameters<F>): Promise<Awaited<ReturnType<F>> | null> {
        for (const fn of fns) {
            const r = await fn(...args);
            if (r)
                return r;
        }
        return null;
    }

    async parse() {
        await this.invokeAll(this.events.preparse);
        await this.invokeAll(this.events.parse);
        await this.invokeAll(this.events.postparse);
        return this;
    }

    /** When Object3D instances are targeted by animation, they need unique names. */
    createUniqueName(originalName: string) {
        const sanitizedName = PropertyBinding.sanitizeNodeName(originalName || '');

        if (sanitizedName in this.nodeNamesUsed)
            return sanitizedName + '_' + (++this.nodeNamesUsed[sanitizedName]);

        this.nodeNamesUsed[sanitizedName] = 0;
        return sanitizedName;
    }

    //Buffer

    async getBuffer(i: number) {
        if (this.buffers[i])
            return this.buffers[i];

        this.buffers[i] = (async () => {
            if (this.json.buffers[i].type && this.json.buffers[i].type !== 'arraybuffer')
                throw new Error('GLTFLoader: ' + this.json.buffers[i].type + ' buffer type is not supported.');

            const result = await fetch(new URL(this.json.buffers[i].uri, this.ctx.ressourceBaseURL));
            return result.arrayBuffer();
        })();

        return this.buffers[i]
    }

    async getBufferView(i: number) {
        const bufferViewDef = this.json.bufferViews[i];
        const byteLength = bufferViewDef.byteLength || 0;
        const byteOffset = bufferViewDef.byteOffset || 0;
        return (await this.getBuffer(bufferViewDef.buffer)).slice(byteOffset, byteOffset + byteLength);
    }

    setBuffer(i: number, buff: ArrayBuffer) {
        this.buffers[i] = Promise.resolve(buff);
    }
}

