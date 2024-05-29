import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";

export class SourceExtention extends GLTFParserLoaderExtension<TexImageSource> {

    getRaw(index: number) {
        return this.parser.json.images[index]
    }

    async load(raw) {
        if (raw.bufferView) {
            const buffer = await this.parser.getBufferView(raw.bufferView);
            return await createImageBitmap(new Blob([buffer], {
                type: raw.mimeType
            }));
        }

        if (!raw.uri)
            return null;

        const r = await fetch(new URL(raw.uri, this.parser.ctx.ressourceBaseURL));
        return await createImageBitmap(await r.blob());
    }
}