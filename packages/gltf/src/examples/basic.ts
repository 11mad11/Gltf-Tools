import { AmbientLight, PerspectiveCamera, WebGLRenderer } from "three";
import { Extensions, GLTFLoader } from "..";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const loader = new GLTFLoader();
Extensions.registerBasic(loader);

const url = new URL("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/5460021c0abb8874826652a3853dd0be0ba28fe2/Models/Avocado/glTF/Avocado.gltf");
const parser = await loader.load(url);

const scene = await parser.getExtension(Extensions.SceneExtension).loadDefaultScene()!;

const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(0xAA9999);

scene.add(new AmbientLight())

const camera = new PerspectiveCamera(75, 1, 0.01, 100);
const control = new OrbitControls(camera, renderer.domElement);
control.target.set(0,.03,0);
control.minDistance = .1;
control.update();
control.minDistance = 0;

//resize
const container = document.querySelector(".content");
function resize() {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', () => resize(), false);
container.append(renderer.domElement);
setTimeout(() => resize(), 0)

//render
function render() {
    control.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);