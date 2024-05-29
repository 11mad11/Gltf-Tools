import { GLTFParser } from "./GLTFLoader";
import { Loader, LoaderArray } from "./LoaderArray";


export abstract class GLTFParserExtension {

    static init(e: GLTFParserExtension) {
        e.init();
    }

    constructor(
        public parser: GLTFParser
    ) {
    }

    protected init() { }
}

export abstract class GLTFParserLoaderExtension<T> extends GLTFParserExtension implements Loader<T> {

    public readonly loaders: LoaderArray<T>
    protected cache: T[] = [];
    protected cached: boolean = true;
    priority = 0;

    constructor(
        public parser: GLTFParser
    ) {
        super(parser);
        this.loaders = new LoaderArray();
        this.loaders.add(this);
    }

    load?(raw: any): T | Promise<T> | null
    modify?(raw: any, value: T): void
    preprocess?(raw: any): Promise<any | undefined> | any | undefined

    abstract getRaw(index: number): any
    public getProcessedRaw(index: number | object): any {
        return this.loaders.preprocess(typeof index === "number" ? this.getRaw(index) : index);
    }

    public async getLoaded(index: number | object) {
        console.log("Loading",index,this.constructor.name);
        if (typeof index === "number") {
            const cached = this.cache[index];
            if (cached)
                return cached;
        }

        const raw = await this.getProcessedRaw(index);
        const value = await this.loaders.load(raw);

        if (typeof value === "object") {
            if (raw.name && "name" in value) value.name = raw.name;
            if (raw.extras && "userData" in value) Object.assign(value.userData, raw.extras);
        }
        await this.loaders.modify(raw, value);

        if (typeof index === "number")
            this.cache[index] = value;

        console.log("Loaded",index,this.constructor.name,value);
        return value;
    }

}
