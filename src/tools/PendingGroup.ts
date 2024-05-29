
export class PendingGroup implements PromiseLike<void> {

    pending = new Map<PromiseLike<any>, Promise<any>>();
    forks: WeakRef<PendingGroup>[] = [];

    constructor() {

    }

    then<TResult1 = void, TResult2 = never>(onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        return Promise.all([
            ...this.pending.keys(),
            ...this.forks.map(f => f.deref()).filter(f => !!f)
        ]).then(() => onfulfilled()).catch(onrejected);
    }

    fork() {
        const group = new PendingGroup();
        this.forks.push(new WeakRef(group));
        return group;
    }

    add(promise: Promise<any> | (() => Promise<any>)) {
        if (typeof promise === "function")
            promise = promise();
        const key = promise;
        this.pending.set(key, promise.then(() => {
            this.pending.delete(key);
        }));
    }

}