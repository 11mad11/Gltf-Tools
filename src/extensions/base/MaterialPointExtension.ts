import { Material, PointsMaterial } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";

export class MaterialPointExtension extends GLTFParserLoaderExtension<Material> {

    getRaw(index: number) {
        return this.parser.json.materials[index];
    }
    load() {
        //TODO PointsMaterial
        return new PointsMaterial();
    }
}