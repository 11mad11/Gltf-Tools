//reference
//https://www.khronos.org/files/gltf20-reference-guide.pdf
//https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L3684
//https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#geometry-overview

import { GLTFLoader } from '..'

export * from './base/AccessorExtension'
export * from './base/AssetExtension'
export * from './base/CameraExtension'
export * from './base/MaterialExtension'
export * from './base/MaterialPbrExtension'
export * from './base/MeshExtension'
export * from './base/NodeExtension'
export * from './base/SceneExtension'
export * from './base/TextureExtension'

export async function registerBasic(loader: GLTFLoader){
    //Order is important
    loader.register((await import("./base/AccessorExtension")).AccessorExtension);
    loader.register((await import("./base/CameraExtension")).CameraExtension);
    loader.register((await import("./base/MaterialExtension")).MaterialExtension);
    loader.register((await import("./base/MaterialPbrExtension")).MaterialPbrExtension);
    loader.register((await import("./base/NodeExtension")).NodeExtension);
    loader.register((await import("./base/MeshExtension")).MeshExtension);
    loader.register((await import("./base/SceneExtension")).SceneExtension);
    loader.register((await import("./base/TextureExtension")).TextureExtension);
}

export * from './KHR_materials_unlit'
