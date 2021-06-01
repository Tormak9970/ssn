import * as stream from 'stream';

/** Returns a promise that resolves as soon as the given stream has the given number of bytes ready for reading. */
function waitReadableLength(inputStream: stream.Readable, minLength: number): Promise<void> {
  return new Promise(function(resolve) {
    const interval = setInterval(function() {
      if (inputStream.readableLength >= minLength) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

/** Reads the given number of bytes from the stream and returns them as a buffer, optionally waiting until the bytes are ready for reading. */
export default async function readBytesFromStream(inputStream: stream.Readable, length: number): Promise<Buffer> {
  let localFileHeader: Buffer = inputStream.read(length);
  while (localFileHeader === null) {
    //need to wait until data is ready for reading
    await waitReadableLength(inputStream, length);
    localFileHeader = inputStream.read(length);
  }
  return localFileHeader;
}
