import { LineBasicMaterial, Material } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";

export class MateriaLineExtension extends GLTFParserLoaderExtension<Material> {

    getRaw(index: number) {
        return this.parser.json.materials[index];
    }

    load() {
        //TODO LineBasicMaterial
        return new LineBasicMaterial();
    }

}