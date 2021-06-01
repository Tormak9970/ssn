import * as stream from 'stream';

export default function arrayBufferToStream(arrayBuffer: ArrayBuffer, offset: number = 0, length?: number): stream.Readable {
  if (offset < 0 || offset >= arrayBuffer.byteLength - 1) {
    throw new RangeError('Could not convert ArrayBuffer to ReadableStream; out of bounds.');
  }
  if (length !== undefined && offset + length >= arrayBuffer.byteLength - 1) {
    throw new RangeError('Could not convert ArrayBuffer to ReadableStream; out of bounds.');
  }

  let position = offset;
  const endPosition = (length !== undefined) ? (offset + length) : arrayBuffer.byteLength;
  const byteArray = new Uint8Array(arrayBuffer);
  const outStream = new stream.Readable({
    read(size) {
      const chunkSize = Math.min(size, endPosition - position);
      let needMoreData: boolean;
      do {
        //If end is reached
        if (position >= endPosition - 1) {
          outStream.push(null);
          return;
        }

        //Write chunk to stream
        const chunk = Buffer.allocUnsafe(chunkSize);
        for (let i = 0; i < chunkSize; i += 1) {
          chunk.writeUInt8(byteArray[position + i], i);
        }
        position += chunk.length;
        needMoreData = outStream.push(chunk);
      } while (needMoreData);
    },
  });

  return outStream;
}
