import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import fetch from "node-fetch";
import { resolve } from "path";
import { finished } from "stream/promises";
import { GLTFLoader, Extensions } from "../src";

test("Avocado", async () => {
    if (!existsSync("./test/tmp")) mkdirSync("./test/tmp");

    const destination = resolve("./test/tmp/Avocado.glb");
    if (!existsSync(destination)) {
        const res = await fetch("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/5460021c0abb8874826652a3853dd0be0ba28fe2/Models/Avocado/glTF-Binary/Avocado.glb");
        const fileStream = createWriteStream(destination, { flags: 'wx' });
        await finished(res.body!.pipe(fileStream));
    }


    const loader = new GLTFLoader();
    await Extensions.registerBasic(loader);

    await loader.parseBinary(readFileSync(destination).buffer);
})