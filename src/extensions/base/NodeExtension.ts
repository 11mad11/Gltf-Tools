import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension"
import { Group, Matrix4, Object3D } from "three";


export class NodeExtension extends GLTFParserLoaderExtension<Object3D> {

    protected cached: boolean = false;

    getRaw(index: number) {
        return this.parser.json.nodes[index];
    }

    load(raw) {
        const count = raw.children?.length || 0;
        const obj = count > 0 ? new Group() : new Object3D();
        return obj;
    }

    async modify(raw, obj) {
        if (raw.matrix !== undefined) {
            const matrix = new Matrix4();
            matrix.fromArray(raw.matrix);
            obj.applyMatrix4(matrix);
        } else {
            if (raw.translation !== undefined)
                obj.position.fromArray(raw.translation);
            if (raw.rotation !== undefined)
                obj.quaternion.fromArray(raw.rotation);
            if (raw.scale !== undefined)
                obj.scale.fromArray(raw.scale);
        }

        await Promise.all((raw.children as any[] || []).map(async i => {
            const child = await this.getLoaded(i);
            obj.add(child);
        }));

        return obj;
    }
}