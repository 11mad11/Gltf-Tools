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

### Supported extension
- EXT_materials_bump
- KHR_materials_unlit
- KHR_mesh_quantization
- KHR_lights_punctual

### TODO
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
- [ ] WebP
- [ ] Mesh Instancing
- [ ] Move buffer to parser extension
- [ ] Use case exemples
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