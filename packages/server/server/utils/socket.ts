import { Server as Engine } from "engine.io";
import { Server } from "socket.io";

const ctx = (async () => {
    const engine = new Engine();
    const io = new Server();
    io.bind(engine);

    io.on("connection", async (socket) => {
        /*console.log(socket);*/
        // ...
    });

    return {
        engine,
        io
    }
})();

export function useSocket() {
    return ctx;
}