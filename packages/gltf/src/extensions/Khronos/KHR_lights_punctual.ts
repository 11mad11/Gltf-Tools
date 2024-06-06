import { Camera, Color, DirectionalLight, Light, LightShadow, PointLight, SpotLight } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";
import { NodeExtension } from "../base/NodeExtension";
import { LoaderArray } from "../../tools/LoaderArray";

export class KHR_lights_punctual extends GLTFParserLoaderExtension<Light> {

    private cnt = 0

    getRaw(index: number) {
        return this.parser.json.extensions.KHR_lights_punctual.lights[index];
    }

    protected init(): void {
        const that = this;

        this.parser.getExtension(NodeExtension).loaders.add({
            priority: -1,
            load(raw) {
                if (raw.extensions?.KHR_lights_punctual?.light !== undefined)
                    return that.getLoaded(raw.extensions.KHR_lights_punctual.light);
            },
        })
    }

    modify(raw, light) {
        light.color = raw.color ? new Color(raw.color[0], raw.color[1], raw.color[2]) : light.color;
        light.intensity = raw.intensity ?? 1;
        light.position.set(0, 0, 0);
        light.name = this.parser.createUniqueName(raw.name || "light_" + this.cnt++)
    }

    load(raw) {
        switch (raw.type) {
            case "directional": {
                const light = new DirectionalLight();

                light.target.position.set(0, 0, -1);
                light.add(light.target);

                return light;
            }
            case "point": {
                const light = new PointLight();
                light.decay = 2;
                light.distance = raw.range ?? 0;

                return light;
            }
            case "spot": {
                const light = new SpotLight();
                light.decay = 2;
                light.distance = raw.range ?? 0;

                const inner = raw.innerConeAngle ?? 0;
                const outer = raw.outerConeAngle ?? Math.PI / 4.0;
                light.angle = outer;
                light.penumbra = 1 - inner / outer;

                light.target.position.set(0, 0, -1);
                light.add(light.target);

                return light;
            }
        }
    }
}