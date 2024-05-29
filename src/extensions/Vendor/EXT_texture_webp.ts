import { GLTFParserExtension } from "../../tools/GLTFParserExtension";
import { TextureExtension } from "../base/TextureExtension";

export class EXT_texture_webp extends GLTFParserExtension {

    protected init(): void {
        this.parser.getExtension(TextureExtension).loaders.add({
            priority: -1,
            preprocess(raw) {
                if(raw.extensions?.["EXT_texture_webp"])
                    raw.source = raw.extensions?.["EXT_texture_webp"].source
            },
        })
    }
}