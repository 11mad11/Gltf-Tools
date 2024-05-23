import { ClampToEdgeWrapping, LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, MirroredRepeatWrapping, NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, RepeatWrapping, Texture } from "three";
import { GLTFParserExtension } from "../../GLTFParserExtension"
import { GLTFPointer, GLTFResolvedPointer } from "../../GLTFLoader";

const WEBGL_FILTERS = {
    9728: NearestFilter,
    9729: LinearFilter,
    9984: NearestMipmapNearestFilter,
    9985: LinearMipmapNearestFilter,
    9986: NearestMipmapLinearFilter,
    9987: LinearMipmapLinearFilter
} as const;

const WEBGL_WRAPPINGS = {
    33071: ClampToEdgeWrapping,
    33648: MirroredRepeatWrapping,
    10497: RepeatWrapping
} as const;

export class TextureExtension extends GLTFParserExtension {
    /**
     * Pointer point to the Image
     * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-image
     */
    imageLoader: ((p: GLTFPointer) => TexImageSource | Promise<TexImageSource>)[] = [
        (p) => this.imageLoaderURI(p),
        (p) => this.imageLoaderBufferView(p),
    ];

    /**
     * Pointer point to the Texture
     */
    textureSourceLoaders: ((p: GLTFPointer) => TexImageSource | Promise<TexImageSource>)[] = [
        (p) => this.loadImage(this.parser.json.textures[p.index].source)
    ];
    textureModifiers: ((p: GLTFResolvedPointer<Texture>) => void | Promise<void>)[] = [];

    async loadTexture(index: number): Promise<Texture> {
        //https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-texture
        const textureDef = this.parser.json.textures[index];
        const image = await this.parser.invokeOne(this.textureSourceLoaders, { index, raw: textureDef, type: "textures" });

        //https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-sampler
        const samplerDef = {
            magFilter: 9729,
            minFilter: 9987,
            wrapS: 10497,
            wrapT: 10497,
            ...this.parser.json.samplers[textureDef.sampler]
        };

        const text = new Texture(
            image,
            undefined,
            samplerDef.wrapS,
            samplerDef.wrapT,
            samplerDef.magFilter,
            samplerDef.minFilter
        );

        if (textureDef.name) text.name = textureDef.name;
        if (textureDef.extras) Object.assign(text.userData, textureDef.extras);

        this.parser.invokeAll(this.textureModifiers, {
            index,
            raw: textureDef,
            type: "textures",
            value: text
        });

        return text;
    }

    async loadImage(index: number): Promise<TexImageSource> {
        const raw = this.parser.json.images[index];
        const img = await this.parser.invokeOne(this.imageLoader, { index, raw, type: "images" });
        return img;
    }

    private async imageLoaderURI(p: GLTFPointer) {
        if (!p.raw.uri)
            return null;
        const r = await fetch(new URL(p.raw.uri, this.parser.ctx.ressourceBaseURL));
        return await createImageBitmap(await r.blob());
    }

    private async imageLoaderBufferView(p: GLTFPointer) {
        if (p.raw.bufferView === undefined)
            return null;
        const buffer = await this.parser.getBufferView(p.raw.bufferView);
        return await createImageBitmap(new Blob([buffer], {
            type: p.raw.mimeType
        }));
    }
}