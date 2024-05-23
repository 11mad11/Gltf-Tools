
export interface Loader<T = any> {
    priority: number,
    load?(raw: any): T | Promise<T> | null
    modify?(raw: any, value: T): void
}

export class LoaderArray<T> {

    loaders: Loader[] = [];

    add(loader: Loader<T>) {
        for (var i = 0; i < this.loaders.length; i++) {
            if (this.loaders[i].priority > loader.priority) {
                i--
                break;
            }
        }
        this.loaders.splice(i, 0, loader);
    }

    async load(raw: any): Promise<T | null> {
        for (const loader of this.loaders) {
            const v = loader.load?.(raw);
            if (v)
                return v;
        }
        return null;
    }

    async modify(raw: any, value: T) {
        for (const loader of this.loaders) {
            loader.modify?.(raw, value);
        }
    }
}