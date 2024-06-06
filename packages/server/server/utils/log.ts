import { ref } from "vue";

const consumer: ((...args: any[]) => void)[] = [];
const logs: any[][] = [];

export function useLog() {
    return {
        logs,
        log(...args: any[]) {
            logs.push(args);
            logs.splice(20);
            consumer.forEach(c => c(...args));
        },
        consume(cb: typeof consumer[number]) {
            consumer.push(cb);
        }
    }
}