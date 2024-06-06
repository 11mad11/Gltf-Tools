import { Color, LinearSRGBColorSpace, MeshBasicMaterial } from "three";
import { GLTFParserExtension } from "../../tools/GLTFParserExtension";
import { MaterialTriangleExtension } from "../base/MaterialTriangleExtension";
import { TextureExtension } from "../base/TextureExtension";

export class KHR_materials_unlit extends GLTFParserExtension {

    protected init(): void {
        this.parser.getExtension(MaterialTriangleExtension).loaders.add({
            priority: -1,
            load(raw) {
                if (!raw.extensions?.["KHR_materials_unlit"])
                    return null;

                return new MeshBasicMaterial();
            },
            async modify(raw, value) {
                if (!raw.extensions?.["KHR_materials_unlit"] || !(value instanceof MeshBasicMaterial))
                    return null;

                value.color = new Color(1, 1, 1);
                value.opacity = 1;

                const metallicRoughness = raw.pbrMetallicRoughness
                if (metallicRoughness) {
                    if (Array.isArray(metallicRoughness.baseColorFactor)) {
                        const array = metallicRoughness.baseColorFactor;
                        value.color.setRGB(array[0], array[1], array[2], LinearSRGBColorSpace);
                        value.opacity = array[3];
                    }

                    if (metallicRoughness.baseColorTexture !== undefined) {
                        //TODO SRGBColorSpace
                        //https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L3284
                        value.map = await this.parser.getExtension(TextureExtension).loadTexture(metallicRoughness.baseColorTexture);
                    }
                }
            },
        })
    }
}