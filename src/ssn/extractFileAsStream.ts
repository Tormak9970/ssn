import * as stream from 'stream';
import * as zlib from 'zlib';
import ISsnFileEntry from '../interfaces/ISsnFileEntry';
import decryptTransform from './streams/decryptTransform';
import readBytesFromStream from './streams/readBytesFromStream';

/** Extracts the file with the given metadata from the stream.
 * The stream must already start at the .zip's local file header
 * and must transparently span across multiple disks if necessary.
 */
export default async function extractFileAsStream(file: ISsnFileEntry, inputStream: stream.Readable): Promise<stream.Readable> {
  let curStream = inputStream;

  //pipe into decryption if file is encrypted
  if (file.decryptionKeys !== undefined) {
    const transform = decryptTransform(file.decryptionKeys);
    curStream = curStream.pipe(transform);
    //skip encryption header
    await readBytesFromStream(curStream, 12);
  }

  //pipe into decompression
  const decompressTransform = zlib.createInflateRaw();
  decompressTransform.on('error', function(error) {
    //TODO: need to throw error sync, not async
    throw new Error(`Error during decompression of "${file.name}": ${error.message}`);
  });
  curStream = curStream.pipe(decompressTransform);

  return curStream;
}
