import { BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute } from "three";
import { GLTFParserExtension } from "../../GLTFParserExtension";
import { WEBGL_TYPE_SIZES, WEBGL_COMPONENT_TYPES } from "./Const";

export class AccessorExtension extends GLTFParserExtension {

    async loadAccessor(index: number) {
        const accessorDef = this.parser.json.accessors[index];

        if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
            const itemSize = WEBGL_TYPE_SIZES[accessorDef.type as keyof typeof WEBGL_TYPE_SIZES];
            const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType as keyof typeof WEBGL_COMPONENT_TYPES];
            const normalized = accessorDef.normalized === true;

            const array = new TypedArray(accessorDef.count * itemSize);
            return new BufferAttribute(array, itemSize, normalized);
        }

        const bufferView = accessorDef.bufferView === undefined ? null : this.parser.getBufferView(accessorDef.bufferView);
        const sparseIndicesBuffer = accessorDef.sparse === undefined ? null : this.parser.getBufferView(accessorDef.sparse.indices.bufferView);
        const sparseValuesBuffer = accessorDef.sparse === undefined ? null : this.parser.getBufferView(accessorDef.sparse.values.bufferView);

        const itemSize: number = WEBGL_TYPE_SIZES[accessorDef.type as keyof typeof WEBGL_TYPE_SIZES];
        const TypedArray: (typeof WEBGL_COMPONENT_TYPES)[keyof typeof WEBGL_COMPONENT_TYPES] = WEBGL_COMPONENT_TYPES[accessorDef.componentType as keyof typeof WEBGL_COMPONENT_TYPES];

        // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
        const elementBytes = TypedArray.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;
        const byteOffset = accessorDef.byteOffset || 0;
        const byteStride = accessorDef.bufferView !== undefined ? this.parser.json.bufferViews[accessorDef.bufferView].byteStride : undefined;
        const normalized = accessorDef.normalized === true;
        let array, bufferAttribute;

        // The buffer is not interleaved if the stride is the item size in bytes.
        if (byteStride && byteStride !== itemBytes) {
            // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
            // This makes sure that IBA.count reflects accessor.count properly
            const ibSlice = Math.floor(byteOffset / byteStride);
            array = new TypedArray(await bufferView!, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes);

            // Integer parameters to IB/IBA are in array elements, not bytes.
            const ib = new InterleavedBuffer(array, byteStride / elementBytes);
            bufferAttribute = new InterleavedBufferAttribute(ib, itemSize, (byteOffset % byteStride) / elementBytes, normalized);
        } else {
            if (bufferView === null)
                array = new TypedArray(accessorDef.count * itemSize);
            else
                array = new TypedArray(await bufferView, byteOffset, accessorDef.count * itemSize);

            bufferAttribute = new BufferAttribute(array, itemSize, normalized);
        }

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
        if (accessorDef.sparse !== undefined) {
            const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
            const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType as keyof typeof WEBGL_COMPONENT_TYPES];

            const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
            const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

            const sparseIndices = new TypedArrayIndices(await sparseIndicesBuffer!, byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
            const sparseValues = new TypedArray(await sparseValuesBuffer!, byteOffsetValues, accessorDef.sparse.count * itemSize);

            if (bufferView !== null) {
                // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                bufferAttribute = new BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
            }

            for (let i = 0, il = sparseIndices.length; i < il; i++) {
                const index = sparseIndices[i];

                bufferAttribute.setX(index, sparseValues[i * itemSize]);
                if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
                if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
                if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
                if (itemSize >= 5) throw new Error('GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
            }

        }

        return bufferAttribute;
    }

}