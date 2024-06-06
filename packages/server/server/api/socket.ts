
import { defineEventHandler } from "h3";
import { useSocket } from "../utils/socket";

export default defineLazyEventHandler(async () => {
    const { engine } = await useSocket();

    return defineEventHandler({
        handler(event) {
            engine.handleRequest(event.node.req, event.node.res);
            event._handled = true;
        },
        websocket: {
            open(peer) {
                const nodeContext = peer.ctx.node;
                const req = nodeContext.req;

                // @ts-expect-error private method
                engine.prepare(req);

                const rawSocket = nodeContext.req.socket;
                const websocket = nodeContext.ws;

                // @ts-expect-error private method
                engine.onWebSocket(req, rawSocket, websocket);
            }
        }
    });
})