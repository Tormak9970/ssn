import * as stream from 'stream';
import readBytesFromStream from './readBytesFromStream';

/** Reads the local file header, which is included before
 * each stored file, and advances the stream accordingly.
 * Returns length of the local file header.
 */
export default async function readLocalFileHeader(inputStream: stream.Readable, skipAdditionalLength = false): Promise<number> {
  const localFileHeader = await readBytesFromStream(inputStream, 30);

  //Local file header signature
  const magic = localFileHeader.readUInt32LE(0);
  if (magic !== 0x04034B50) {
    throw new Error(`Local file header had wrong magic; expected 0x04034B50 but got 0x${magic.toString(16).padStart(8, '0')}.`);
  }
  //All fields in the local file header are copies of the central file header, so we can skip them.
  //FIXME: Maybe we should actually read these fields to verify that they are identical?
  //skip 22 bytes
  const localFilenameSize = localFileHeader.readUInt16LE(26);
  const localExtraSize = localFileHeader.readUInt16LE(28);

  //skip local file name and extra field
  const additionalLength = localFilenameSize + localExtraSize;
  if (skipAdditionalLength && additionalLength > 0) {
    await readBytesFromStream(inputStream, additionalLength);
  }

  return 30 + additionalLength;
}
