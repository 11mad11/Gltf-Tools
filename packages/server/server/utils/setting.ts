import { reactive, watch } from "vue";

const settingP = (async () => {
    const store = useStorage<Partial<{
        watchDir: string,
        tmpDir: string
    }>>("db");

    const setting = reactive(await store.getItem("setting") ?? {
    });

    watch(setting, () => {
        store.setItem("setting", setting);
    }, { deep: true });

    return setting;
})();

export async function useSetting(){
    return await settingP;
}