import { GLTFParserExtension, GLTFParser, GLTFPointer, GLTFResolvedPointer } from "../..";
import { Group, Matrix4, Object3D } from "three";



export class NodeExtension extends GLTFParserExtension {

    /**
     * args: CreationEvent, type object, GLTFParser
     */
    nodeCreated: ((p: GLTFResolvedPointer<Object3D>) => void | Promise<void>)[] = [];
    private cache: Object3D[] = [];

    nodeLoaders: ((p: GLTFPointer) => Object3D | Promise<Object3D>)[] = [
        ({ raw }) => {
            const count = raw.children?.length || 0;
            const obj = count > 0 ? new Group() : new Object3D();
            return obj;
        }
    ]

    constructor(parser: GLTFParser) {
        super(parser);
    }

    async loadNode(index: number) {
        if (this.cache[index])
            return this.cache[index];

        const raw = this.parser.json.nodes[index];
        const obj = await this.createNode(index);

        if (raw.name) obj.name = this.parser.createUniqueName(raw.name);
        if (raw.extras) Object.assign(obj.userData, raw.extras);

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

        await this.parser.invokeAll(this.nodeCreated, { index, raw, value: obj, type: "nodes" });

        this.cache[index] = obj;

        Promise.all((raw.children || []).map(async i => {
            const child = await this.loadNode(i);
            obj.add(child);
        }));

        return obj;
    }

    private async createNode(index: number) {
        for (const l of this.nodeLoaders) {
            const r = await l({ index, raw: this.parser.json.nodes[index], type: "nodes" });
            if (r)
                return r;
        }
    }

}