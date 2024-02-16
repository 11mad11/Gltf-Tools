import { Object3D, Scene } from "three";
import { GLTFParserExtension, GLTFResolvedPointer } from "../..";
import { NodeExtension } from "..";

export class SceneExtension extends GLTFParserExtension {

    sceneModifiers: ((p: GLTFResolvedPointer<Scene>, nodes: Object3D[]) => void | Promise<void>)[] = [];

    async loadScene(index: number): Promise<Scene> {
        const nodeExt = this.parser.getExtension(NodeExtension);
        const raw = this.parser.json.scenes[index];
        const scene = new Scene();

        const nodes = await Promise.all((raw.nodes as number[]).map(async i => {
            const node = await nodeExt.loadNode(i);
            scene.add(node);
            return node;
        }));

        if (raw.name) scene.name = this.parser.createUniqueName(raw.name);
        if (raw.extras) Object.assign(scene.userData, raw.extras);

        this.parser.invokeAll(this.sceneModifiers, { index, raw, value: scene, type: "scenes" }, nodes);

        return scene;
    }

    loadDefaultScene() {
        if (this.parser.json.scene === undefined)
            return null;
        return this.loadScene(this.parser.json.scene);
    }

}