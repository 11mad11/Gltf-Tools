import { AnimationClip, BufferAttribute, InterleavedBufferAttribute, Interpolant, InterpolateLinear, KeyframeTrack, Mesh, NumberKeyframeTrack, Object3D, Quaternion, QuaternionKeyframeTrack, VectorKeyframeTrack } from "three";
import { GLTFParserLoaderExtension } from "../../tools/GLTFParserExtension";
import { NodeExtension } from "./NodeExtension";
import { AccessorExtension } from "./AccessorExtension";
import { INTERPOLATION, PATH_PROPERTIES } from "./Const";

export class AnimationExtension extends GLTFParserLoaderExtension<AnimationClip> {
    private cnt = 0;

    nodeExt = this.parser.getExtension(NodeExtension);
    accesExt = this.parser.getExtension(AccessorExtension);

    protected init(): void {
        const that = this;
    }

    getRaw(index: number) {
        return this.parser.json.animations[index];
    }

    async load(raw) {
        const channels = raw.channels;
        const samplers = raw.samplers;
        const tracks = [];
        const animationName = raw.name ? raw.name : 'animation_' + this.cnt++;

        for (const channel of channels) {
            if (channel.target.node === undefined)
                continue;

            const sampler = samplers[channel.sampler];

            const [
                target,
                input,
                output
            ] = await Promise.all([
                this.nodeExt.getLoaded(channel.target.node),
                this.accesExt.getLoaded(raw.parameters?.[sampler.input] ?? sampler.input),
                this.accesExt.getLoaded(raw.parameters?.[sampler.output] ?? sampler.output)
            ]);

            target.updateMatrix();

            const createdTracks = this.createAnimationTracks(target, input, output, sampler, channel.target);

            if (createdTracks)
                for (let k = 0; k < createdTracks.length; k++)
                    tracks.push(createdTracks[k]);
        }

        return new AnimationClip(animationName, undefined, tracks);
    }

    private createAnimationTracks(node: Object3D, input: BufferAttribute | InterleavedBufferAttribute, output: BufferAttribute | InterleavedBufferAttribute, sampler: any, target: any) {
        const tracks = [];
        const targetNames = [];

        if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
            node.traverse(function (object) {
                if (object instanceof Mesh && object.morphTargetInfluences) {
                    targetNames.push(object.name ? object.name : object.uuid);
                }
            });
        } else {
            targetNames.push(node.name ? node.name : node.uuid);
        }

        let TypedKeyframeTrack: typeof KeyframeTrack;
        switch (PATH_PROPERTIES[target.path]) {
            case PATH_PROPERTIES.weights:
                TypedKeyframeTrack = NumberKeyframeTrack;
                break;
            case PATH_PROPERTIES.rotation:
                TypedKeyframeTrack = QuaternionKeyframeTrack;
                break;
            case PATH_PROPERTIES.translation:
            case PATH_PROPERTIES.scale:
                TypedKeyframeTrack = VectorKeyframeTrack;
                break;
            default:
                switch (output.itemSize) {
                    case 1:
                        TypedKeyframeTrack = NumberKeyframeTrack;
                        break;
                    case 2:
                    case 3:
                    default:
                        TypedKeyframeTrack = VectorKeyframeTrack;
                        break;
                }
                break;
        }

        const interpolation = INTERPOLATION[sampler.interpolation] ?? InterpolateLinear;
        const outputArray = this.accesExt.getArrayFromAccessor(output);

        for (const targetName of targetNames) {
            const track = new TypedKeyframeTrack(
                targetName + '.' + PATH_PROPERTIES[target.path],
                input.array,
                outputArray,
                interpolation
            );

            // Override interpolation with custom factory method.
            if (sampler.interpolation === 'CUBICSPLINE') {
                track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
                    // A CUBICSPLINE keyframe in glTF has three output values for each input value,
                    // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
                    // must be divided by three to get the interpolant's sampleSize argument.
                    const interpolantType = (this instanceof QuaternionKeyframeTrack) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;
                    return new interpolantType(this.times, this.values, this.getValueSize() / 3, result);
                } as any;

                // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
                //@ts-ignore
                track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
            }

            tracks.push(track);
        }

        return tracks;
    }
}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

    constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
        super(parameterPositions, sampleValues, sampleSize, resultBuffer);
    }

    copySampleValue_(index) {
        // Copies a sample value to the result buffer. See description of glTF
        // CUBICSPLINE values layout in interpolate_() function below.

        const result = this.resultBuffer,
            values = this.sampleValues,
            valueSize = this.valueSize,
            offset = index * valueSize * 3 + valueSize;

        for (let i = 0; i !== valueSize; i++) {
            result[i] = values[offset + i];
        }

        return result;
    }

    interpolate_(i1, t0, t, t1) {
        const result = this.resultBuffer;
        const values = this.sampleValues;
        const stride = this.valueSize;

        const stride2 = stride * 2;
        const stride3 = stride * 3;

        const td = t1 - t0;

        const p = (t - t0) / td;
        const pp = p * p;
        const ppp = pp * p;

        const offset1 = i1 * stride3;
        const offset0 = offset1 - stride3;

        const s2 = - 2 * ppp + 3 * pp;
        const s3 = ppp - pp;
        const s0 = 1 - s2;
        const s1 = s3 - pp + p;

        // Layout of keyframe output values for CUBICSPLINE animations:
        //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
        for (let i = 0; i !== stride; i++) {
            const p0 = values[offset0 + i + stride]; // splineVertex_k
            const m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
            const p1 = values[offset1 + i + stride]; // splineVertex_k+1
            const m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

            result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
        }

        return result;
    }
}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
    interpolate_(i1, t0, t, t1) {
        const result = super.interpolate_(i1, t0, t, t1);
        _q.fromArray(result).normalize().toArray(result);
        return result;
    }
}