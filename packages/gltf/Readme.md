# GLTF Tool for threejs

Tools to make GLTF fun.

### Planned
- Blender plugin template
- GLTF Exporter

## GLTFLoader 

### Goal
- Easy to extend
- Easy to maintain
- Easy to use
- Flexible (Can load some invalide gltf file. Ex: bad extensionsRequired & extensionsUsed)<br/>
assume the json is to spec but do not enforce spec

### Supported
- GLTF 2.0 (WIP)
- KHR_materials_unlit
- KHR_lights_punctual
- EXT_texture_webp

### TODO for v1
- [ ] Look for TODO in the code
- [ ] Enable stric mode in tsconfig
- [ ] Write Test
- [ ] Colorspace
- [ ] Material Extensions
- [ ] Skin
- [ ] Animation
- [ ] Extract KHR_mesh_quantization from Mesh
- [ ] Mesh Draco
- [ ] Image compression
- [ ] Mesh Instancing
- [ ] Move buffer to parser extension
- [X] Use case exemples
- [ ] Caches/Optimization
- [ ] VRM? https://vrm.dev/en/vrm/vrm_about/
- [x] KHR_lights_punctual
- [x] Accessor
- [x] Morph
- [x] Camera
- [x] Texture
- [x] Material
- [x] Node
- [x] Scene
- [x] Mesh

# Thing to note

## Node
Since in GLTF a node may be refered by multiple scene and it's not possible in ThreeJs, there's no cache on the NodeExtention. The SceneExtention will cache its scenes with their children.

## Animation

The node target of each channel is converted to a Path for a KeyframeTrack. For that, the node and its children are loaded with NodeExtention. If the node have no name, the UUID is used but since the node is temporary, the UUID is not valide.

The node target can be of different scene, wich may cause probleme.
