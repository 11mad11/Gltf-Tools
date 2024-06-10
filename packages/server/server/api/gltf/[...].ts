import { readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { useLog } from "../../utils/log";
import { useGltf } from "../../utils/GLTF";

export default defineLazyEventHandler(async () => {
    const log = useLog().log;
    const gltf = await useGltf();

    return defineEventHandler((event) => {
        setResponseHeader(event, "Cache-Control", "no-cache");
        log(event);
        return serveStatic(event, {
            getContents: (id) => gltf.read(id.substring(10))?.[0],
            getMeta: async (id) => {
                const info = gltf.read(id.substring(10));

                if (!info)
                    return;

                return {
                    size: info[0].byteLength,
                    mtime: info[1]
                };
            },
            indexNames: []
        });

    });
});