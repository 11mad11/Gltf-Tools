import { AmbientLight, AnimationClip, AnimationMixer, BufferGeometry, Camera, CameraHelper, Clock, DirectionalLight, DirectionalLightHelper, Light, Mesh, Object3D, PerspectiveCamera, PointLight, PointLightHelper, Scene, Sphere, SpotLight, SpotLightHelper, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFParser } from "./GLTFLoader";
import * as Extensions from "../extensions";

const defaultConfig = {
    renderer: {
        antialias: true,
        alpha: true,
    } as ConstructorParameters<typeof WebGLRenderer>[0]
};


type Config = typeof defaultConfig;

export class Viewer {
    renderer: WebGLRenderer;

    camera = new PerspectiveCamera(75, 1, 0.01, 1000);
    control: OrbitControls;
    ambiant = new AmbientLight();
    mixer = new AnimationMixer(new Object3D());
    clock = new Clock();

    cameras: Camera[] = [];
    scenes: Scene[] = [];
    animations: AnimationClip[] = [];

    _sceneIndex = 0;
    _cameraIndex = -1;
    _animationIndex = -1;

    constructor(config?: Config) {
        config = mergeDeep(config ?? {}, defaultConfig);

        this.renderer = new WebGLRenderer(config.renderer);
        this.renderer.setClearColor(0xAA9999);
        this.renderer.shadowMap.enabled = true;

        this.control = new OrbitControls(this.camera, this.renderer.domElement);

        window.addEventListener('resize', () => this.resize(), false);

        this.renderer.domElement.addEventListener("dblclick", () => {
            this.selectCamera(this._cameraIndex >= this.cameras.length ? -1 : this._cameraIndex + 1);
        });

        this.initContextMenu();

        if (localStorage.getItem("inspect") === "true")
            //@ts-ignore
            spector.captureCanvas(renderer.domElement);
    }

    private initContextMenu() {
        const contextmenuDiv = document.createElement('div');
        document.body.append(contextmenuDiv);
        Object.assign(contextmenuDiv.style, {
            position: 'absolute',
            border: "solid 1px black",
            display: "none",
            "flex-direction": "column",
            "max-height": "50vh",
            "overflow-y": "scroll"
        })
        contextmenuDiv.oncontextmenu = e => e.preventDefault();

        function btn(txt: string, cb: () => void) {
            const lbl = document.createElement("span");
            contextmenuDiv.append(lbl);
            Object.assign(lbl.style, {

            });
            lbl.textContent = txt;
            lbl.onclick = () => {
                contextmenuDiv.style.display = "none";
                cb();
            };
            lbl.oncontextmenu = e => e.preventDefault();
        }

        let moved = false;
        this.renderer.domElement.addEventListener("mousedown", (e) => {
            contextmenuDiv.style.display = "none";
            moved = false;
        });
        this.renderer.domElement.addEventListener("mouseup", (e) => {
            if (moved || e.button != 2)
                return;
            contextmenuDiv.innerHTML = "";

            btn("Toggle Debug", () => {
                this.scenes[this._sceneIndex].traverse((n) => {
                    if (n.constructor.name.indexOf("Helper") !== -1 || n.type.indexOf("Helper") !== -1)
                        n.visible = !n.visible;
                })
            });

            if (this._animationIndex !== -1)
                btn("Stop Animation", () => {
                    this.selectAnimation(-1);
                });
            for (let i = 0; i < this.animations.length; i++) {
                if (i === this._animationIndex)
                    continue;
                btn("Animation: " + (this.animations[i].name || i), () => {
                    this.selectAnimation(i);
                });
            }

            for (let i = 0; i < this.scenes.length; i++) {
                if (i === this._sceneIndex)
                    continue;
                btn("Scene: " + (this.scenes[i].name || i), () => {
                    this.selectScene(i);
                });
            }
            if (this._animationIndex !== -1)
                btn("Orbit Camera", () => {
                    this.selectCamera(-1);
                });
            for (let i = 0; i < this.cameras.length; i++) {
                if (i === this._cameraIndex)
                    continue;
                btn("Camera: " + (this.cameras[i].name || i), () => {
                    this.selectCamera(i);
                });
            }

            contextmenuDiv.style.display = "flex";
            contextmenuDiv.style.top = e.clientY + "px";
            contextmenuDiv.style.left = e.clientX + "px";
        });
        this.renderer.domElement.addEventListener("mousemove", () => {
            moved = true;
        });
        this.renderer.domElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
    }

    clear() {
        this.cameras.length = 0;
        this.scenes.length = 0;
        this._cameraIndex = -1;
        this._sceneIndex = 0;
        this.mixer.stopAllAction();
    }

    resize() {
        const container = this.renderer.domElement.parentElement;
        if (!container)
            return;

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();

        for (const cam of this.cameras) {
            if (!(cam instanceof PerspectiveCamera))
                continue;
            cam.aspect = container.clientWidth / container.clientHeight;
            cam.updateProjectionMatrix();
        }
    }

    mount(el: Element) {
        el.append(this.renderer.domElement);
        setTimeout(() => this.resize(), 0);
    }

    async loadFromParser(parser: Promise<GLTFParser> | GLTFParser, animation = true) {
        this.clear();
        parser = await parser;
        const scenes = await parser.getExtension(Extensions.SceneExtension).loadAllScene() ?? [];
        const cameras = await parser.getExtension(Extensions.CameraExtension).loadAllCamera() ?? [];

        this.load({
            scenes,
            cameras,
            currentScene: parser.getExtension(Extensions.SceneExtension).defaultSceneIndex,
            currentCamera: parser.getExtension(Extensions.CameraExtension).defaultCameraIndex,
        });

        if (animation && parser.json.animations?.length) {
            const animations = (parser.json.animations as any[]).map((_, i) => parser.getExtension(Extensions.AnimationExtension).getLoaded(i))
            this.loadAnimations(await Promise.all(animations));
            this.selectAnimation(0);
        }

        this.resize();
    }

    load(cfg: { scenes: Scene[], cameras: Camera[], currentScene?: number, currentCamera?: number }) {
        this.scenes = cfg.scenes;
        this.cameras = cfg.cameras;

        for (const scene of this.scenes) {
            let doLight = true;

            const todos: (() => void)[] = []
            scene.traverse(n => {
                n.castShadow = true;

                if (n instanceof Light) {
                    doLight = false;
                    if (n instanceof PointLight)
                        todos.push(() => scene.add(new PointLightHelper(n, 0.1)))
                    if (n instanceof SpotLight)
                        todos.push(() => scene.add(new SpotLightHelper(n)))
                    if (n instanceof DirectionalLight)
                        todos.push(() => scene.add(new DirectionalLightHelper(n)))
                } else
                    n.receiveShadow = true;
                if (n instanceof Camera) {
                    todos.push(() => scene.add(new CameraHelper(n)))
                }
            });

            for (const t of todos)
                t();

            scene.traverse((n) => {
                if (n.constructor.name.indexOf("Helper") !== -1 || n.type.indexOf("Helper") !== -1)
                    n.visible = !n.visible;
            })

            if (doLight)
                scene.add(this.ambiant.clone());
        }

        this.selectCamera(cfg.currentCamera > -1 ? cfg.currentCamera : -1);
        this.selectScene(cfg.currentScene ?? 0);
        this.selectAnimation(-1);
    }

    loadAnimations(anims: AnimationClip[]) {
        this.animations = anims;
        this._animationIndex = -1;
        this.mixer.stopAllAction();
    }

    selectAnimation(i: number) {
        this._animationIndex = i;
        this.mixer.stopAllAction();
        if (!this.animations[i])
            return;
        const action = this.mixer.clipAction(this.animations[i], this.scenes[this._sceneIndex]);
        action.play();
    }

    selectScene(i: number) {
        this.selectAnimation(-1);
        const scene = this.scenes[i];
        const sphere = new Sphere(undefined, 0.0001);

        scene.traverse((n) => {
            sphere.center.add(n.position);
            sphere.center.divideScalar(2)
        });

        scene.traverse((n) => {
            if (n.constructor.name.indexOf("Helper") !== -1)
                return;
            if (n instanceof Mesh && n.geometry instanceof BufferGeometry) {
                n.geometry.computeBoundingSphere();
                const bs = n.geometry.boundingSphere.clone().translate(n.position);
                console.log(n.scale);
                sphere.union(bs);
            }
            return n;
        });

        console.log(sphere);

        this.control.target.copy(sphere.center);
        this.control.minDistance = (1 / (sphere.radius + 1)) * 0.5 + sphere.radius;
        this.control.update();
        this.control.minDistance = 0;
    }

    selectCamera(i: number) {
        this._cameraIndex = i;
    }

    render() {
        const scene = this.scenes[this._sceneIndex];
        if (!scene)
            return;
        this.control.update();
        this.renderer.render(scene, this.cameras[this._cameraIndex] ?? this.camera);
    }

    loop(fn: () => void) {
        if (!this.renderer.domElement?.checkVisibility?.())
            return;
        fn();
        this.mixer.update(this.clock.getDelta());
        this.render();
        requestAnimationFrame(() => this.loop(fn));
    }

}

/**
* Performs a deep merge of objects and returns new object. Does not modify
* objects (immutable) and merges arrays via concatenation.
*
* @param {...object} objects - Objects to merge
* @returns {object} New object with merged key/values
*/
function mergeDeep(...objects) {
    //https://stackoverflow.com/a/48218209/1944920
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            }
            else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            }
            else {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
}