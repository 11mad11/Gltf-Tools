import { FSWatcher } from "chokidar";
import { reactive, watch, watchEffect } from "vue";
import fs from "node:fs";

type GLTF = Awaited<ReturnType<typeof useGltf>>;
type SETTING = Awaited<ReturnType<typeof useSetting>>;
type SOCKET = Awaited<ReturnType<typeof useSocket>>;
type LOG = ReturnType<typeof useLog>["log"];

type CTX = {
    gltf: GLTF,
    setting: SETTING,
    socket: SOCKET,
    log: LOG,
    state: {
        id: string | null
    }
}

export default defineNitroPlugin((nitroApp) => {
    const unsub = nitroApp.hooks.hook("request", () => ctx)
    const ctx = (async () => {
        const state = reactive<CTX["state"]>({
            id: null
        });
        const log = useLog();
        const gltf = await useGltf();
        const setting = await useSetting();
        const socket = await useSocket();

        const ctx = { gltf, setting, socket, log: log.log, state };

        settingCom(ctx);
        setupLog(ctx);
        watchDir(ctx);

        watch(state, () => {
            socket.io.emit("state", state);
        }, { deep: true });
        socket.io.on("connection", (socket) => {
            socket.emit("state", state);
        });

        unsub();
    })()
})

function settingCom({ socket, setting }: CTX) {
    socket.io.on("connection", (socket) => {
        socket.on("setting", async (arg, cb) => {
            try {
                const parsed = JSON.parse(arg);
                Object.entries(parsed).forEach(([k, v]) => {
                    (setting as any)[k] = v;
                });
            } catch (e: any) {
                cb(e?.message ?? "error");
            }
            cb('');
        });

        socket.emit("setting", setting);
    });

    watch(setting, () => {
        socket.io.emit("setting", setting);
    }, { deep: true });
}

function setupLog({ socket }: CTX) {
    socket.io.on("connection", (socket) => {
        for (const log of useLog().logs) {
            socket.emit("log", "old:", ...log);
        }
    });

    useLog().consume((...args) => {
        socket.io.emit("log", ...args);
    });
}

function watchDir({ gltf, setting, socket, log, state }: CTX) {
    let watcher: FSWatcher;

    watchEffect(() => {
        const watchDir = setting.watchDir;
        if (!watchDir)
            return log("No watchDir in setting");
        if (!fs.existsSync(watchDir) || !fs.statSync(watchDir).isDirectory())
            return log("watchDir directory dose not exist");

        watcher = new FSWatcher({
            ignoreInitial: false,
            cwd: watchDir,
            awaitWriteFinish: true
        });

        let loading = false;
        watcher.on("all", (e, path) => {
            log(e, path);
            if (!loading && (e === "change" || e === "add") && (path.endsWith("gltf") || path.endsWith("glb"))) {
                loading = true;
                gltf.load(path, watchDir).then((result) => {
                    state.id = result;
                    loading = false;
                }).catch((e) => {
                    log("error", e?.message ?? e);
                    loading = false
                });
            }
        });

        watcher.add(".");
    })
}