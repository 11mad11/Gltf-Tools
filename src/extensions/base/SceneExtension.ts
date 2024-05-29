import { Scene } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension"
import { NodeExtension } from "./NodeExtension";

export class SceneExtension extends GLTFParserLoaderExtension<Scene> {

    getRaw(index: number) {
        return this.parser.json.scenes[index];
    }

    async load(raw) {
        const nodeExt = this.parser.getExtension(NodeExtension);
        const scene = new Scene();

        await Promise.all((raw.nodes as number[]).map(async i => {
            const node = await nodeExt.getLoaded(i);
            scene.add(node);
        }));

        return scene;
    }

    loadDefaultScene() {
        if (this.parser.json.scene === undefined)
            return null;
        return this.getLoaded(this.parser.json.scene);
    }

    get defaultSceneIndex() {
        return this.parser.json.scene;
    }

    loadAllScene() {
        if (this.parser.json.scenes === undefined)
            return null;
        return Promise.all((this.parser.json.scenes as any[]).map((_, i) => this.getLoaded(i)));
    }

}