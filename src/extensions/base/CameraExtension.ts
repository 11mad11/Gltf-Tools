import { Camera, OrthographicCamera, PerspectiveCamera } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension"
import { NodeExtension } from "./NodeExtension";

export class CameraExtension extends GLTFParserLoaderExtension<Camera> {

    protected init(): void {
        const that = this;

        this.parser.getExtension(NodeExtension).loaders.add({
            priority: -1,
            load(raw) {
                if (raw.camera !== undefined)
                    return that.getLoaded(raw.camera);
            },
        })
    }

    getRaw(index: number) {
        return this.parser.json.cameras[index];
    }

    async loadAllCamera() {
        if(!this.parser.json.cameras)
            return null;
        return Promise.all((this.parser.json.cameras as any[])?.map((v, i) => {
            return this.getLoaded(i);
        }));
    }

    loadDefaultCamera() {
        if (this.parser.json.camera === undefined)
            return null;
        return this.getLoaded(0);
    }

    get defaultCameraIndex() {
        return 0;
    }

    async load(raw) {
        const params = raw[raw.type];
        if (raw.type === 'perspective')
            return new PerspectiveCamera(params.yfov * 180 / Math.PI, params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
        else if (raw.type === 'orthographic')
            return new OrthographicCamera(- params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar);
    }
}