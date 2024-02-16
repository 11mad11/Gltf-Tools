import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { MaterialExtension } from "..";
import { GLTFParserExtension, GLTFResolvedPointer } from "../..";

export class MaterialPbrExtension extends GLTFParserExtension {

    predicateIsPhysical: ((raw: any) => boolean)[] = [];
    /**
     * will be run for MeshPhysicalMaterial and MeshStandardMaterial
     */
    standardMaterialModifiers: ((p: GLTFResolvedPointer<MeshStandardMaterial>) => void | Promise<void>)[] = [];
    /**
     * will be run only for MeshPhysicalMaterial
     */
    physicalMaterialModifiers: ((p: GLTFResolvedPointer<MeshPhysicalMaterial>) => void | Promise<void>)[] = [];

    protected init(): void {
        this.parser.getExtension(MaterialExtension).trianglesMaterialLoaders.unshift(p => p && this.loadMaterial(p.index));
    }

    async loadMaterial(index: number) {
        const raw = this.parser.json.materials[index];
        const physical = this.predicateIsPhysical.some(p => p(raw));
        if (physical) {
            const mat = new MeshPhysicalMaterial();
            await Promise.all(this.standardMaterialModifiers.map(m => m({ raw, index, type: "materials", value: mat })));
            await Promise.all(this.physicalMaterialModifiers.map(m => m({ raw, index, type: "materials", value: mat })));
            return mat;
        }
        const mat = new MeshStandardMaterial();
        await Promise.all(this.standardMaterialModifiers.map(m => m({ raw, index, type: "materials", value: mat })));
        return mat;
    }

}