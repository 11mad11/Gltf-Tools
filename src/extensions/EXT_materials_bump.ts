import { MaterialPbrExtension, TextureExtension } from ".";
import { GLTFParserExtension } from "../GLTFParserExtension";

export class EXT_materials_bump extends GLTFParserExtension {

    protected init(): void {
        this.parser.getExtension(MaterialPbrExtension).predicateIsPhysical.push(raw => {
            return !!raw.extensions?.["EXT_materials_bump"]
        });
        this.parser.getExtension(MaterialPbrExtension).physicalMaterialModifiers.push(async (p) => {
            if (!p.raw.extensions?.["EXT_materials_bump"])
                return;

            const extension = p.raw.extentions?.["EXT_materials_bump"];
            p.value.bumpScale = extension.bumpFactor !== undefined ? extension.bumpFactor : 1.0;
            if (extension.bumpTexture !== undefined)//https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L3284
                p.value.bumpMap = await this.parser.getExtension(TextureExtension).loadTexture(extension.bumpTexture);
        });
    }

}