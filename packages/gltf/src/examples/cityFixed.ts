import { Material, Mesh, MeshStandardMaterial } from "three";
import { Extensions, GLTFLoader, GLTFParserExtension, Viewer } from "..";
console.log(0);
const viewer = new Viewer();
viewer.mount(document.querySelector(".content"));

const loader = new GLTFLoader();
Extensions.registerBasic(loader);
loader.register(Extensions.EXT_texture_webp);
loader.register(Extensions.KHR_lights_punctual);
loader.register(Extensions.KHR_materials_unlit);
loader.register(class extends GLTFParserExtension {

    protected init(): void {
        //We can hook in the parser here
        this.parser.getExtension(Extensions.NodeExtension).loaders.add({
            priority: -10,//We want to run before everything else
            preprocess(raw) {
                //In here, we can modify the raw json. We work with a copy so no change occur in this.parser.json

                //the property 'mesh' in a gltf node is optionnal, so we check if it is there.
                if (detectGrayBoxFromMeshRaw(raw)) {
                    //We remove all the gray box.
                    raw.mesh = undefined;
                }

            }
        })
        this.parser.getExtension(Extensions.MaterialTriangleExtension).loaders.add({
            priority: 10,//We want to run after everything else
            modify(raw, value) {
                //We can modify the loaded value here
                if(value instanceof MeshStandardMaterial){
                    value.emissiveMap = value.map;
                    value.emissive.set(0.2,0.2,0.2);
                }
            },
        })
    }

})

const commit = "5460021c0abb8874826652a3853dd0be0ba28fe2";
const url = new URL("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/VirtualCity/glTF-Binary/VirtualCity.glb");
const parser = await loader.load(url);

//We could modify the parser behavior here.
//But it is not recommended in case an extention preload things when initiated in the line above.
parser.getExtension(Extensions.NodeExtension).loaders.add({
    priority: 0.1,
    modify(raw, value) {
        //Modify the node here
    },
});

viewer.ambiant.intensity = 0;
await viewer.loadFromParser(parser);

//Nothing prevent us to modify after importing
const heli = viewer.scenes[0].getObjectByName("heli-body_3") as Mesh;
heli.geometry.computeBoundingSphere();
heli.position.add(heli.geometry.boundingSphere.center)
heli.geometry.center();
(heli.material as Material).transparent = true;
(heli.material as Material).depthWrite = false;

viewer.loop(() => {
    heli.rotateY(.1);
});

export {
    viewer,
    parser,
    loader
}

function detectGrayBoxFromMeshRaw(raw: any/* ,parser: GLTFParser*/) {
    if (raw.mesh !== undefined) {
        return (parser.json.meshes[raw.mesh].primitives as any[]).some(p => {
            const material = p.material;
            //the property 'material' in a gltf primitive is optionnal, so we check if it is there.
            //And we filter by material name
            if (
                material &&
                ["_1_-_Default", "_1111"].find(t => t === parser.json.materials[material].name)
            ) {
                console.log(parser.json.materials[material].name);
                return true;
            }
        })
    }
    return false;
}