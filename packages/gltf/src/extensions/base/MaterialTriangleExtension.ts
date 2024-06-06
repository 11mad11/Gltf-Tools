import { DoubleSide, LinearSRGBColorSpace, Material, MeshStandardMaterial } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";
import { TextureExtension } from "./TextureExtension";
import { ALPHA_MODES } from "./Const";

export class MaterialTriangleExtension extends GLTFParserLoaderExtension<Material> {

    getRaw(index: number) {
        return this.parser.json.materials[index];
    }

    async load(raw) {
        const pending = this.parser.pending.fork();

        const mat = new MeshStandardMaterial({
            metalness: raw?.pbrMetallicRoughness?.metallicFactor ?? 0,
            roughness: raw?.pbrMetallicRoughness?.roughnessFactor ?? 0,
        });

        const baseColorFactor = raw?.pbrMetallicRoughness?.baseColorFactor;
        if (baseColorFactor) {
            mat.color.setRGB(baseColorFactor[0], baseColorFactor[1], baseColorFactor[2], LinearSRGBColorSpace);
            mat.opacity = baseColorFactor[3];
        }

        const baseColorTexture = raw?.pbrMetallicRoughness?.baseColorTexture;
        if (baseColorTexture)
            pending.add(this.parser.getExtension(TextureExtension).getLoaded(baseColorTexture.index).then(map => {
                mat.map = map;
                mat.map.channel = baseColorTexture.texCoord ?? 0
            }));

        const normalTexture = raw?.normalTexture;
        if (normalTexture)
            pending.add(this.parser.getExtension(TextureExtension).getLoaded(normalTexture.index).then(map => {
                mat.normalMap = map;
                mat.normalScale.setScalar(normalTexture.scale ?? 1);
                mat.normalMap.channel = normalTexture.texCoord ?? 0
            }));

        const emissiveFactor = raw?.emissiveFactor;
        if (emissiveFactor) {
            mat.emissive.setRGB(emissiveFactor[0], emissiveFactor[1], emissiveFactor[2], LinearSRGBColorSpace);
        }

        const emissiveTexture = raw?.emissiveTexture;
        if (emissiveTexture)
            pending.add(this.parser.getExtension(TextureExtension).getLoaded(emissiveTexture.index).then(map => {
                mat.emissiveMap = map;
                mat.emissiveMap.channel = emissiveTexture.texCoord ?? 0
            }));

        const alphaMode = raw.alphaMode || ALPHA_MODES.OPAQUE;
        if (alphaMode === ALPHA_MODES.BLEND) {
            mat.transparent = true;
            // See: https://github.com/mrdoob/three.js/issues/17706
            mat.depthWrite = false;
        } else {
            mat.transparent = false;
            if (alphaMode === ALPHA_MODES.MASK)
                mat.alphaTest = raw.alphaCutoff !== undefined ? raw.alphaCutoff : 0.5;
        }

        await pending;

        mat.needsUpdate = true;
        return mat;
    }

    async modify(raw, value) {
        if (raw.doubleSided === true)
            value.side = DoubleSide;
    }

}