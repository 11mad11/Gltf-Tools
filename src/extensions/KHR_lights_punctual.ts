import { Color, DirectionalLight, Light, PointLight, SpotLight } from "three";
import { GLTFParserExtension, GLTFPointer } from "../GLTFLoader";
import { NodeExtension } from "./base/NodeExtension";

export class KHR_lights_punctual extends GLTFParserExtension {

    public lightLoaders: ((p: GLTFPointer) => Light | Promise<Light>)[] = [
        (p) => {
            switch (p.raw.type) {
                case "directional": {
                    const light = new DirectionalLight();

                    light.target.position.set(0, 0, -1);
                    light.add(light.target);

                    return light;
                }
                case "point": {
                    const light = new PointLight();
                    light.decay = 2;
                    light.distance = p.raw.range ?? 0;

                    return light;
                }
                case "spot": {
                    const light = new SpotLight();
                    light.decay = 2;
                    light.distance = p.raw.range ?? 0;

                    const inner = p.raw.innerConeAngle ?? 0;
                    const outer = p.raw.outerConeAngle ?? Math.PI / 4.0;
                    light.angle = outer;
                    light.penumbra = 1 - inner / outer;

                    light.target.position.set(0, 0, -1);
                    light.add(light.target);

                    return light;
                }
            }
        }
    ];

    protected init(): void {
        this.parser.getExtension(NodeExtension).nodeCreated.push(async p => {
            if (p.raw.extensions.KHR_lights_punctual.light !== undefined)
                p.value.add(await this.loadLight(p.raw.extensions.KHR_lights_punctual.light))
        })
    }

    async loadLight(index: number) {
        const raw = this.parser.json.extensions.KHR_lights_punctual.lights[index];
        const light = await this.parser.invokeOne(this.lightLoaders, { index, raw, type: "extensions.KHR_lights_punctual.lights" });

        if (!light)
            throw new Error('GLTFLoader: light unsupported: ' + raw.type);

        light.color = raw.color ? new Color(raw.color[0], raw.color[1], raw.color[2]) : light.color;
        light.intensity = raw.intensity ?? 1;
        light.position.set(0, 0, 0);

        light.name = this.parser.createUniqueName(raw.name || "light_" + index)
        if (raw.extras) Object.assign(light.userData, raw.extras);

        return light;
    }
}