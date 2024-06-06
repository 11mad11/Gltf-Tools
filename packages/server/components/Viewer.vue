<script setup lang="ts">
import { Extensions, GLTFLoader, GLTFParser, Viewer } from "../../gltf/src";
import { io } from "socket.io-client";

declare module window {
    let viewer: Viewer
    let loader: GLTFLoader
    let parser: GLTFParser
}

const viewer = new Viewer();
window.viewer = viewer;
const canvasDiv = ref<HTMLDivElement>();

const socket = io({
    path: "/api/socket"
});
socket.on("connect", () => console.log("connected"));
socket.on("disconnect", () => console.log("disconnect"));
socket.on("setting", async (setting) => {
});
socket.on("load", async (id) => {
    const loader = new GLTFLoader();
    window.loader = loader;
    Extensions.registerBasic(loader);
    loader.register(Extensions.EXT_texture_webp);
    loader.register(Extensions.KHR_lights_punctual);
    loader.register(Extensions.KHR_materials_unlit);

    const parser = await loader.load(new URL(id, new URL("/api/gltf/", location.href)));
    window.parser = parser;
    viewer.loadFromParser(parser);
});
socket.onAny((...args) => console.log(...args));

onMounted(() => {
    viewer.mount(canvasDiv.value!);
    viewer.loop(() => { });
});

onUnmounted(() => {
    socket.close();
    viewer.renderer.domElement.remove();
});

const isOpen = ref(false);
const loading = ref(false);
const setting = ref('');
const error = ref('');
async function mergeSetting() {
    console.log(setting.value);
    error.value = '';
    loading.value = true;
    const rep = await socket.emitWithAck("setting", setting.value);
    loading.value = false;
    error.value = rep;
    if (!rep)
        isOpen.value = false;
}
</script>

<template>
    <div ref="canvasDiv" class="content">
        <UButton class="custom-file-upload" label="Open" @click="isOpen = true" />

        <UModal v-model="isOpen">
            <div class="p-4 flex flex-col">
                <UTextarea v-model="setting" />
                <span>{{ error }}</span>
                <UButton :disabled="loading" :loading="loading" @click="mergeSetting">Confirm</UButton>
            </div>
        </UModal>
    </div>
</template>

<style scoped>
.content {
    background-color: #ecf0f1;
    box-sizing: border-box;
    height: 100vh;
    overflow: hidden;
}

.custom-file-upload {
    position: absolute;
    top: 1rem;
    right: 1rem;
}

.custom-file-upload>input {
    display: none;
}
</style>