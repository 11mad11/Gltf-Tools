//reference
//https://www.khronos.org/files/gltf20-reference-guide.pdf
//https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L3684
//https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#geometry-overview

import { GLTFLoader } from '..';

export * from './base/AccessorExtension';
export * from './base/CameraExtension';
export * from './base/MaterialTriangleExtension';
export * from './base/MaterialPointExtension';
export * from './base/MateriaLineExtension';
export * from './base/NodeExtension';
export * from './base/MeshExtension';
export * from './base/SceneExtension';
export * from './base/SourceExtention';
export * from './base/TextureExtension';
export * from './base/AnimationExtention';

import { AccessorExtension } from "./base/AccessorExtension";
import { CameraExtension } from "./base/CameraExtension";
import { MaterialTriangleExtension } from "./base/MaterialTriangleExtension";
import { MaterialPointExtension } from "./base/MaterialPointExtension";
import { MateriaLineExtension } from "./base/MateriaLineExtension";
import { NodeExtension } from "./base/NodeExtension";
import { MeshExtension } from "./base/MeshExtension";
import { SceneExtension } from "./base/SceneExtension";
import { SourceExtention } from "./base/SourceExtention";
import { TextureExtension } from "./base/TextureExtension";
import { AnimationExtension } from './base/AnimationExtention';

export function registerBasic(loader: GLTFLoader) {
    //Order can be important

    loader.register(AccessorExtension);
    loader.register(MaterialTriangleExtension);
    loader.register(MaterialPointExtension);
    loader.register(MateriaLineExtension);
    loader.register(NodeExtension);
    loader.register(CameraExtension);
    loader.register(MeshExtension);
    loader.register(SceneExtension);
    loader.register(SourceExtention);
    loader.register(TextureExtension);
    loader.register(AnimationExtension);
}

export * from './Khronos/KHR_materials_unlit';
export * from './Khronos/KHR_lights_punctual';
export * from './Vendor/EXT_texture_webp';
