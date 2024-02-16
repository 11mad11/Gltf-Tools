import { OrthographicCamera, PerspectiveCamera } from "three";
import { GLTFParserExtension, GLTFParser } from "../..";

export class CameraExtension extends GLTFParserExtension {

    cache: (PerspectiveCamera | OrthographicCamera)[] = [];

    loadCamera(index: number) {
        if (this.cache[index])
            return this.cache[index];

        const raw = this.parser.json.camera[index];
        const cam = this.createCamera(raw);

        if (raw.name) cam.name = raw.name;
        if (raw.extras) Object.assign(cam.userData, raw.extras);

        return this.cache[index] = cam;
    }

    createCamera(raw: any) {
        const params = raw[raw.type];
        if (raw.type === 'perspective')
            return new PerspectiveCamera(params.yfov * 180 / Math.PI, params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
        else if (raw.type === 'orthographic')
            return new OrthographicCamera(- params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar);
        throw new Error(`GLTFLoader: Camera type '${raw.type}'not supported`);
    }
}