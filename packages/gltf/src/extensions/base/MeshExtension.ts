import { Group, Mesh, BufferGeometry, SkinnedMesh, Object3D, ColorManagement, LinearSRGBColorSpace, LineSegments, Line, LineLoop, Points, TriangleFanDrawMode, TriangleStripDrawMode, Box3, Sphere, Vector3 } from "three";
import { GLTFParserExtension } from "../../tools/GLTFParserExtension";
import { toTrianglesDrawMode } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { WEBGL_CONSTANTS, ATTRIBUTES, WEBGL_COMPONENT_TYPES } from "./Const";
import { GLTFPointer, GLTFResolvedPointer } from "../../tools/GLTFLoader";
import { MaterialPointExtension } from "./MaterialPointExtension";
import { MateriaLineExtension } from "./MateriaLineExtension";
import { AccessorExtension } from "./AccessorExtension";
import { MaterialTriangleExtension } from "./MaterialTriangleExtension";
import { NodeExtension } from "./NodeExtension";

type MeshType = SkinnedMesh | Mesh | LineSegments | Line | LineLoop | Points

export class MeshExtension extends GLTFParserExtension {

    /**
     * obj is either a mesh(line,skin,...) or a group of meshes
     */
    public nodeMeshCreated: ((p: GLTFResolvedPointer<Object3D>) => void | Promise<void>)[] = [];
    /**
     * raw is the primitive currently loading
     */
    public geometryLoaders: ((raw: any) => BufferGeometry | Promise<BufferGeometry>)[] = [(raw) => this.loadGeometry(raw)];
    /**
     * raw is the primitive currently loading
     */
    public primitiveLoaders: ((raw: any, mesh: GLTFPointer) => MeshType | Promise<MeshType>)[] = [(raw, mesh) => this.loadPrimitive(raw, mesh.raw.isSkinnedMesh)];

    init() {
        const that = this;

        that.parser.getExtension(NodeExtension).loaders.add({
            priority: -1,
            async load(raw) {
                if (raw.mesh === undefined)
                    return null;

                const mesh = await that.loadMesh(raw.mesh);
                await that.parser.invokeAll(that.nodeMeshCreated, { index: 0, raw, value: mesh, type: "nodes" });

                return mesh
            },
        });
    }


    async loadMesh(index: number) {
        const meshDef = this.parser.json.meshes[index];
        const primitives = meshDef.primitives;

        const pending: Promise<MeshType>[] = [];

        for (let i = 0, il = primitives.length; i < il; i++) {//this.loadPrimitive(primitives[i], meshDef)
            pending.push(this.parser.invokeOne(this.primitiveLoaders, primitives[i], { index, raw: meshDef, type: "meshes" }))
        }

        return Promise.all(pending).then((meshes) => {
            for (const mesh of meshes) {
                if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
                    this.updateMorphTargets(mesh, meshDef);
                }
                mesh.name = this.parser.createUniqueName(meshDef.name || ('mesh_' + index));
            }

            if (meshes.length === 1) {
                return meshes[0]
            }

            const group = new Group();
            for (let i = 0, il = meshes.length; i < il; i++) {
                group.add(meshes[i]);
            }
            return group;
        });
    }

    async loadPrimitive(raw: any, isSkinnedMesh: boolean): Promise<MeshType> {
        const geometry = this.parser.invokeOne(this.geometryLoaders, raw);

        let mesh: MeshType;

        if (raw.mode === WEBGL_CONSTANTS.TRIANGLES ||
            raw.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
            raw.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
            raw.mode === undefined) {

            // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
            const material = raw.material !== undefined ? this.parser.getExtension(MaterialTriangleExtension).getLoaded(raw.material) : undefined;
            mesh = isSkinnedMesh === true ? new SkinnedMesh(await geometry, await material) : new Mesh(await geometry, await material);

            if (mesh instanceof SkinnedMesh) {
                // normalize skin weights to fix malformed assets
                mesh.normalizeSkinWeights();
            }

            if (raw.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
                mesh.geometry = toTrianglesDrawMode(mesh.geometry, TriangleStripDrawMode);
            } else if (raw.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
                mesh.geometry = toTrianglesDrawMode(mesh.geometry, TriangleFanDrawMode);
            }
        }
        else if (raw.mode === WEBGL_CONSTANTS.LINES)
            mesh = new LineSegments(await geometry, raw.material === undefined ? undefined : await this.parser.getExtension(MateriaLineExtension).getLoaded(raw.material));

        else if (raw.mode === WEBGL_CONSTANTS.LINE_STRIP)
            mesh = new Line(await geometry, raw.material === undefined ? undefined : await this.parser.getExtension(MateriaLineExtension).getLoaded(raw.material));

        else if (raw.mode === WEBGL_CONSTANTS.LINE_LOOP)
            mesh = new LineLoop(await geometry, raw.material === undefined ? undefined : await this.parser.getExtension(MateriaLineExtension).getLoaded(raw.material));

        else if (raw.mode === WEBGL_CONSTANTS.POINTS)
            mesh = new Points(await geometry, raw.material === undefined ? undefined : await this.parser.getExtension(MaterialPointExtension).getLoaded(raw.material));

        else
            throw new Error('GLTFLoader: Primitive mode unsupported: ' + raw.mode);

        if (raw.extras) Object.assign(mesh.userData, raw.extras);

        return mesh;
    }

    async loadGeometry(rawPrimitive: any) {
        const geometry = new BufferGeometry();
        const attributes = rawPrimitive.attributes;

        const pending: Promise<any>[] = [];

        const assignAttributeAccessor = async (accessorIndex, attributeName) => {
            geometry.setAttribute(attributeName, await this.parser.getExtension(AccessorExtension).getLoaded(accessorIndex));
        }

        for (const gltfAttributeName in attributes) {
            const threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();
            pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
        }

        if (rawPrimitive.indices !== undefined && !geometry.index) {
            pending.push((async () => geometry.setIndex(await this.parser.getExtension(AccessorExtension).getLoaded(rawPrimitive.indices) as any))());
        }

        if (ColorManagement.workingColorSpace !== LinearSRGBColorSpace && 'COLOR_0' in attributes)
            console.warn(`GLTFLoader: Converting vertex colors from "srgb-linear" to "${ColorManagement.workingColorSpace}" not supported.`);

        if (rawPrimitive.extras) Object.assign(geometry.userData, rawPrimitive.extras);

        //https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L4487
        this.computeBounds(geometry, rawPrimitive);

        await Promise.all(pending);
        return rawPrimitive.targets !== undefined ? this.addMorphTargets(geometry, rawPrimitive.targets) : geometry;
    }

    async addMorphTargets(geometry: BufferGeometry, targets: any[]): Promise<BufferGeometry> {
        let hasMorphPosition = false;
        let hasMorphNormal = false;
        let hasMorphColor = false;

        for (let i = 0, il = targets.length; i < il; i++) {
            const target = targets[i];

            if (target.POSITION !== undefined) hasMorphPosition = true;
            if (target.NORMAL !== undefined) hasMorphNormal = true;
            if (target.COLOR_0 !== undefined) hasMorphColor = true;

            if (hasMorphPosition && hasMorphNormal && hasMorphColor) break;
        }

        if (!hasMorphPosition && !hasMorphNormal && !hasMorphColor) return geometry;

        if (hasMorphPosition) geometry.morphAttributes.position = [];
        if (hasMorphNormal) geometry.morphAttributes.normal = [];
        if (hasMorphColor) geometry.morphAttributes.color = [];

        const pending = [];
        for (let i = 0, il = targets.length; i < il; i++) {
            const target = targets[i];

            if (hasMorphPosition)
                if (target.POSITION !== undefined)
                    pending.push((async () => geometry.morphAttributes.position[i] = await this.parser.getExtension(AccessorExtension).getLoaded(target.POSITION))());
                else
                    geometry.morphAttributes.position[i] = geometry.attributes.position

            if (hasMorphNormal)
                if (target.NORMAL !== undefined)
                    pending.push((async () => geometry.morphAttributes.normal[i] = await this.parser.getExtension(AccessorExtension).getLoaded(target.NORMAL))());
                else
                    geometry.morphAttributes.normal[i] = geometry.attributes.normal

            if (hasMorphColor)
                if (target.COLOR_0 !== undefined)
                    pending.push((async () => geometry.morphAttributes.color[i] = await this.parser.getExtension(AccessorExtension).getLoaded(target.COLOR_0))());
                else
                    geometry.morphAttributes.color[i] = geometry.attributes.color
        }

        await Promise.all(pending);
        geometry.morphTargetsRelative = true;
        return geometry;
    }

    updateMorphTargets(mesh: MeshType, meshDef: any) {
        mesh.updateMorphTargets();
        if (meshDef.weights !== undefined) {
            for (let i = 0, il = meshDef.weights.length; i < il; i++) {
                mesh.morphTargetInfluences[i] = meshDef.weights[i];
            }
        }

        //TODO transfer to an extention?
        //https://github.com/KhronosGroup/glTF-Blender-IO/issues/362
        //https://github.com/KhronosGroup/glTF/issues/1036
        // .extras has user-defined data, so check that .extras.targetNames is an array.
        if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
            const targetNames = meshDef.extras.targetNames;
            if (mesh.morphTargetInfluences.length === targetNames.length) {
                mesh.morphTargetDictionary = {};
                for (let i = 0, il = targetNames.length; i < il; i++) {
                    mesh.morphTargetDictionary[targetNames[i]] = i;
                }
            } else
                console.warn('GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
        }
    }

    private computeBounds(geometry: BufferGeometry, primitiveDef: any) {
        const attributes = primitiveDef.attributes;
        const box = new Box3();

        if (attributes.POSITION !== undefined) {
            const accessor = this.parser.json.accessors[attributes.POSITION];

            const min = accessor.min;
            const max = accessor.max;

            // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.
            if (min !== undefined && max !== undefined) {
                box.set(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]));

                if (accessor.normalized) {
                    const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                    box.min.multiplyScalar(boxScale);
                    box.max.multiplyScalar(boxScale);
                }
            } else {
                console.warn('GLTFLoader: Missing min/max properties for accessor POSITION.');
                return;
            }
        } else
            return;

        const targets = primitiveDef.targets;
        if (targets !== undefined) {
            const maxDisplacement = new Vector3();
            const vector = new Vector3();

            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];

                if (target.POSITION !== undefined) {
                    const accessor = this.parser.json.accessors[target.POSITION];
                    const min = accessor.min;
                    const max = accessor.max;

                    // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.
                    if (min !== undefined && max !== undefined) {
                        // we need to get max of absolute components because target weight is [-1,1]
                        vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
                        vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
                        vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));

                        if (accessor.normalized) {
                            const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                            vector.multiplyScalar(boxScale);
                        }

                        // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
                        // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
                        // are used to implement key-frame animations and as such only two are active at a time - this results in very large
                        // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
                        maxDisplacement.max(vector);
                    } else
                        console.warn('GLTFLoader: Missing min/max properties for accessor POSITION.');
                }
            }

            // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
            box.expandByVector(maxDisplacement);
        }

        geometry.boundingBox = box;

        const sphere = new Sphere();

        box.getCenter(sphere.center);
        sphere.radius = box.min.distanceTo(box.max) / 2;

        geometry.boundingSphere = sphere;
    }
}

function getNormalizedComponentScale(constructor) {
    // Reference:
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data
    switch (constructor) {
        case Int8Array:
            return 1 / 127;
        case Uint8Array:
            return 1 / 255;
        case Int16Array:
            return 1 / 32767;
        case Uint16Array:
            return 1 / 65535;
        default:
            throw new Error('GLTFLoader: Unsupported normalized accessor component type.');
    }
}