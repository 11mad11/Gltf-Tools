import { Extensions, Viewer } from ".";
import { GLTFLoader, GLTFParser } from "./tools/GLTFLoader";

function importExample(example: string) {
    return import(`./examples/${example}.ts`);
}


function load(name: string) {
    location.hash = name;
    location.reload();
}

type Config<T> = {
    url: string,
    setup?(parser: GLTFParser, viewer: Viewer): T | Promise<T>
    render?(ctx: Awaited<T>): void
} | {
    import: () => Promise<any>
};
const c = <T>(c: Config<T>) => c

const commit = "5460021c0abb8874826652a3853dd0be0ba28fe2";
const configs: Record<string, undefined | Config<any>> = {
    "Avocado.glb": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/Avocado/glTF-Binary/Avocado.glb"
    },
    "Avocado.draco": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/Avocado/glTF-Draco/Avocado.gltf"
    },
    "Avocado.quantized": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/Avocado/glTF-Quantized/Avocado.gltf"
    },
    "light": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/DirectionalLight/glTF/DirectionalLight.gltf"
    },
    "DiffuseTransmissionPlant": c({
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/DiffuseTransmissionPlant/glTF/DiffuseTransmissionPlant.gltf",
        setup(parser, viewer) {
            const scene = viewer.scenes[viewer._sceneIndex];
            scene.getObjectByName("firefly1").receiveShadow = false;
            scene.getObjectByName("firefly1").castShadow = false;
            scene.getObjectByName("firefly2").receiveShadow = false;
            scene.getObjectByName("firefly2").castShadow = false;

            /*return {
                "followcam1_target": scene.getObjectByName("followcam1_target"),
                "followcam2_target": scene.getObjectByName("followcam2_target"),
                "cam1": viewer.cameras[0],
                "cam2": viewer.cameras[1],
            }*/
        },
        render(ctx) {
            //ctx.cam1.lookAt(ctx.followcam1_target.position);
            //ctx.cam2.lookAt(ctx.followcam2_target.position);
        },
    }),
    "DragonDispersion": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/DragonDispersion/glTF/DragonDispersion.gltf"
    },
    "SimpleMorph": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/SimpleMorph/glTF/SimpleMorph.gltf"
    },
    "City": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/VirtualCity/glTF-Binary/VirtualCity.glb"
    },
    "CityFixed": {
        import: () => import("./examples/cityFixed")
    },
    "CesiumMan": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/CesiumMan/glTF-Binary/CesiumMan.glb"
    },
    "AlphaBlendModeTest": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/AlphaBlendModeTest/glTF-Binary/AlphaBlendModeTest.glb"
    },
    "MorphStressTest": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/MorphStressTest/glTF-Binary/MorphStressTest.glb"
    },
    "MeshPrimitiveModes": {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/" + commit + "/Models/MeshPrimitiveModes/glTF-Embedded/MeshPrimitiveModes.gltf"
    }
} as const
{
    const list = document.querySelector("#list");
    Object.entries(configs).forEach(([name, config]) => {
        const item = document.createElement("li");
        item.textContent = name;
        item.onclick = () => load(name);
        list.append(item);
    });
}

let config = configs[(location.hash || "#Avocado.glb").substring(1)];

(async () => {
    if (!config) {
        await importExample(location.hash.substring(1)).catch((e) => {
            if ("message" in e && (e.message as string).startsWith("Unknown variable dynamic import")) {
                console.log("No example found trying as an URL");
                loadFromUrl({ url: location.hash.substring(1) });
            } else {
                throw e;
            }
        });
    } else if ("import" in config) {
        Object.assign(window, await config?.import?.());
    } else if ("url" in config) {
        await loadFromUrl(config);
    }
})();

async function loadFromUrl(config: Extract<Config<any>, { url }>) {
    const viewer = new Viewer();
    window.viewer = viewer;
    viewer.mount(document.querySelector(".content"));

    const loader = new GLTFLoader();
    window.loader = loader;
    Extensions.registerBasic(loader);
    loader.register(Extensions.EXT_texture_webp);
    loader.register(Extensions.KHR_lights_punctual);
    loader.register(Extensions.KHR_materials_unlit);

    const url = new URL(config.url);
    const parser = await loader.load(url);
    window.parser = parser;

    await viewer.loadFromParser(parser);
    console.log(config);
    const ctx = await config.setup?.(parser, viewer);

    viewer.loop(() => config.render?.(ctx));
}


declare module window {
    let viewer: Viewer
    let loader: GLTFLoader
    let parser: GLTFParser
}