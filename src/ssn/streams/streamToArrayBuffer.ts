import * as stream from 'stream';

export default function streamToArrayBuffer(inputStream: stream.Readable): Promise<Buffer> {
  return new Promise(function(resolve, reject) {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    //Convert chunks to string
    inputStream.on('data', function(chunk: Buffer) {
      chunks.push(chunk);
      totalSize += chunk.length;
    });

    //Output final string
    inputStream.on('end', function() {
      const outBuffer = Buffer.concat(chunks, totalSize);
      resolve(outBuffer);
    });

    //Exit on error
    inputStream.on('error', function(error) {
      reject(error);
    });
  });
}
