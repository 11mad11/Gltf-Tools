import { GLTFParser } from "./GLTFLoader";


export abstract class GLTFParserExtension {
    constructor(
        public parser: GLTFParser
    ) {
        this.init();
    }

    protected init() { }
}
