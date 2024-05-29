// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

const config = [
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
            }
        ],
        external: ["three"],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                sourceMap: true,
                declaration: true,
                declarationDir: "./lib"
            }),
            nodeResolve()
        ],
    },
];

if (process.env.EXAMPLE)
    config.push({
        input: "src/example.ts",
        output: [
            {
                dir: "lib",
                format: "es",
                sourcemap: true,
                exports: "named"
            }
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                sourceMap: true
            }),
            nodeResolve(),
            process.env.SERVE && serve({
                contentBase: [
                    'lib',
                    'examples',
                    '.'//needed because the sourcemap point to ./src/file.ts
                ],
                // Options used in setting up server
                host: '0.0.0.0',
                port: 10001,
                headers: {
                    "Access-Control-Allow-Headers": "*"
                }
            }),
            dynamicImportVars({
                // options
            })
        ],
    })

export default config;