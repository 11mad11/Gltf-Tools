import { Extensions, GLTFLoader, Viewer } from "..";

const viewer = new Viewer();
viewer.mount(document.querySelector(".content"));

const loader = new GLTFLoader();
Extensions.registerBasic(loader);

const url = new URL("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/5460021c0abb8874826652a3853dd0be0ba28fe2/Models/Avocado/glTF/Avocado.gltf");
const parser = await loader.load(url);

await viewer.loadFromParser(parser);

viewer.loop(()=>0);