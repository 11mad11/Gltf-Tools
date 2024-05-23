import { Color, LinearSRGBColorSpace, MeshBasicMaterial } from "three";
import { GLTFParserExtension } from "../GLTFParserExtension";
import { MaterialExtension, TextureExtension } from ".";
import { GLTFResolvedPointer } from "../GLTFLoader";

export class KHR_materials_unlit extends GLTFParserExtension {
    materialModifiers: ((p: GLTFResolvedPointer<MeshBasicMaterial>) => void | Promise<void>)[] = [];

    protected init(): void {
        this.parser.getExtension(MaterialExtension).trianglesMaterialLoaders.unshift(async p => {
            if (!p.raw.extensions?.["KHR_materials_unlit"])
                return null;

            const mat = new MeshBasicMaterial();

            mat.color = new Color(1, 1, 1);
            mat.opacity = 1;

            const metallicRoughness = p.raw.pbrMetallicRoughness
            if (metallicRoughness) {
                if (Array.isArray(metallicRoughness.baseColorFactor)) {
                    const array = metallicRoughness.baseColorFactor;
                    mat.color.setRGB(array[0], array[1], array[2], LinearSRGBColorSpace);
                    mat.opacity = array[3];
                }

                if (metallicRoughness.baseColorTexture !== undefined) {
                    //TODO SRGBColorSpace
                    //https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L3284
                    mat.map = await this.parser.getExtension(TextureExtension).loadTexture(metallicRoughness.baseColorTexture);
                }
            }

            return mat;
        })
    }
}