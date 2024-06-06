import { Texture } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";
import { SourceExtention } from "./SourceExtention";
import { WEBGL_FILTERS, WEBGL_WRAPPINGS } from "./Const";

export class TextureExtension extends GLTFParserLoaderExtension<Texture> {

    getRaw(index: number) {
        return this.parser.json.textures[index]
    }

    async load(raw) {
        const image = await this.parser.getExtension(SourceExtention).getLoaded(raw.source);

        //https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-texture
        const texture = new Texture(image);

        //https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-sampler
        const samplerDef = {
            magFilter: 9729,
            minFilter: 9987,
            wrapS: 10497,
            wrapT: 10497,
            ...(this.parser.json?.samplers?.[raw.sampler] || {})
        };

        texture.magFilter = WEBGL_FILTERS[samplerDef.magFilter];
        texture.minFilter = WEBGL_FILTERS[samplerDef.minFilter];
        texture.wrapS = WEBGL_WRAPPINGS[samplerDef.wrapS];
        texture.wrapT = WEBGL_WRAPPINGS[samplerDef.wrapT];

        texture.needsUpdate = true;

        return texture;
    }
}