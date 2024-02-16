// rollup.config.js
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "lib/index.mjs",
                format: "es",
                sourcemap: false,
                exports: "named",
            },
            {
                file: "lib/index.umd.js",
                name: "GLTF",
                format: "umd",
                sourcemap: false,
                exports: "named",
            },
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                sourceMap: false,
                declaration: true,
                declarationDir: "./lib"
            }),
        ],
    },
];