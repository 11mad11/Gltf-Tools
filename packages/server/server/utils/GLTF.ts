import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { FSWatcher } from "chokidar";
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { basename, dirname, join, relative, resolve } from "path";

const ioP = (async () => new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(), // Optional.
        'draco3d.encoder': await draco3d.createEncoderModule(), // Optional.
    }))();

let cachedName: string;
let cachedBin: Uint8Array;
let cahchedTime: number;

export async function useGltf() {
    const log = useLog().log;
    const setting = await useSetting();
    const io = await ioP;

    /*let tmpDir = tmpdir();
    watchEffect(() => {
        if (setting.tmpDir?.length)
            tmpDir = setting.tmpDir;
    })*/


    const ctx = {
        async load(path: string, cwd: string) {
            path = resolve(join(cwd, path));
            const document = await io.read(path);

            document.getRoot().listTextures().forEach((t) => {
                log(t.getURI());
            })
            document.getRoot().listBuffers().forEach((t) => {
                log(t.getURI());
            })

            await document.transform(
                dedup(),
                textureCompress({encoder: sharp,quality:1})
            );

            /*const tmp = fs.mkdtempSync(join(tmpDir, 'gltf-'));
            const file = join(tmp, "assets.glb");*/
            cachedBin = await io.writeBinary(document);
            const file = relative(cwd, path);
            cachedName = join(dirname(file), basename(file) + ".glb");
            cahchedTime = Date.now();
            return cachedName;
        },
        read(id: string) {
            if (cachedName === id)
                return [cachedBin, cahchedTime] as const
        }
    };



    return ctx;
}

export async function gltf(path: string, cb: () => void) {
    const io = await ioP;
    const document = await io.read(path);
    const watcher = new FSWatcher()

    function reload() {

    }

    document.getRoot().listTextures().forEach(r => {
        const uri = r.getURI();
        if (uri.length)
            watcher.add(join(dirname(path), uri));
    });
    document.getRoot().listBuffers().forEach(r => {
        const uri = r.getURI();
        if (uri.length)
            watcher.add(join(dirname(path), uri));
    });
    watcher.on("change", () => cb());

    return {
        document,
        reload
    }
}