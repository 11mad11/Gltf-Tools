import { LineBasicMaterial, Material, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PointsMaterial } from "three";
import { GLTFParserExtension, GLTFPointer } from "../..";

export class MaterialExtension extends GLTFParserExtension {

    pointsMaterialLoaders: ((p: GLTFPointer) => Material | Promise<Material>)[] = [() => new PointsMaterial()];
    linesMaterialLoaders: ((p: GLTFPointer) => Material | Promise<Material>)[] = [() => new LineBasicMaterial()];
    trianglesMaterialLoaders: ((p: GLTFPointer) => Material | Promise<Material>)[] = [() => new MeshBasicMaterial()];

    /**
     * @deprecated maybe???
     */
    materialModifiers: ((m: Material) => void | Promise<void>)[] = [];

    async loadMaterial(index: number | undefined, type: "points" | "lines" | "triangles") {
        const raw = this.parser.json.materials?.[index];
        const loaders = this.getLoaders(type);

        const r = await this.parser.invokeOne(loaders, raw ? { raw, index, type: "materials" } : null)
        if (!r)
            throw new Error("GLTFLoader: No loader found to load Material")

        this.materialModifiers.forEach(m => m(r))
        return r;
    }

    private getLoaders(type: "points" | "lines" | "triangles") {
        switch (type) {
            case "points":
                return this.pointsMaterialLoaders;
            case "lines":
                return this.linesMaterialLoaders;
            case "triangles":
                return this.trianglesMaterialLoaders;
            default:
                throw "";
        }
    }

}