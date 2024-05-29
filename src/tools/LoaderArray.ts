
export interface Loader<T = any, M = T> {
    priority: number,
    load?(raw: any): T | Promise<T> | null
    modify?(raw: any, value: M): Promise<void> | void
    preprocess?(raw: any): Promise<any | undefined> | any | undefined
}

export class LoaderArray<T, M = T> {

    constructor(
        public loaders: Loader<T, M>[] = []
    ) {

    }

    add(loader: Loader<T, M>) {
        for (var i = 0; i < this.loaders.length; i++) {
            if (this.loaders[i].priority > loader.priority) {
                i--
                break;
            }
        }
        this.loaders.splice(i, 0, loader);
    }

    async load(raw: any) {
        for (const loader of this.loaders) {
            const v = await loader.load?.(raw);
            if (v)
                return v;
        }
        return null;
    }

    async preprocess(raw: any) {
        //TODO optimize?
        raw = JSON.parse(JSON.stringify(raw));
        for (const loader of this.loaders) {
            if (!loader.preprocess)
                continue;
            raw = await loader.preprocess(raw) ?? raw;
        }
        return raw;
    }

    async modify(raw: any, value: M) {
        for (const loader of this.loaders) {
            await loader.modify?.(raw, value);
        }
    }
}