import { GLTFLoader } from "../src"
import { SceneExtension, registerBasic } from "../src/extensions";

test('Basic', async () => {
    const loader = new GLTFLoader();
    await registerBasic(loader);
    const result = await loader.parseJSON({
        "scene": 0,
        "scenes": [
            {
                "nodes": [0]
            }
        ],

        "nodes": [
            {
                "mesh": 0,
                "extras":{
                    "test": "good"
                }
            }
        ],

        "meshes": [
            {
                "primitives": [{
                    "attributes": {
                        "POSITION": 1
                    },
                    "indices": 0
                }]
            }
        ],

        "buffers": [
            {
                "uri": "data:application/octet-stream;base64,AAABAAIAAAAAAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAPwAAAAA=",
                "byteLength": 44
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": 6,
                "target": 34963
            },
            {
                "buffer": 0,
                "byteOffset": 8,
                "byteLength": 36,
                "target": 34962
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5123,
                "count": 3,
                "type": "SCALAR",
                "max": [2],
                "min": [0]
            },
            {
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126,
                "count": 3,
                "type": "VEC3",
                "max": [1.0, 1.0, 0.0],
                "min": [0.0, 0.0, 0.0]
            }
        ],

        "asset": {
            "version": "2.0"
        }
    }, {});

    console.log(await result.getExtension(SceneExtension).loadDefaultScene());
});