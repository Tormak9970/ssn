/**
 * The file format used by Solid State Networks is based on the .zip format.
 * Check the .ZIP File Format Specification <https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT>.
 */

import ISsnFileEntry from '../../interfaces/ISsnFileEntry';
import getDecryptionKeys from '../decryption/getDecryptionKeys';
import modifyPassword from '../decryption/modifyPassword';

const SIGNATURE_END_OF_CENTRAL_DIR = 0x06054b50;
const SIGNATURE_CENTRAL_DIR = 0x02014b50;
const COMPRESSION_DEFLATE = 8;

const Decoder = new TextDecoder('utf-8');

export default function readSsnFile(buffer: ArrayBuffer): ISsnFileEntry[] {
  const dv = new DataView(buffer);

  const fileEntries: ISsnFileEntry[] = [];

  //--------------- READ END OF CENTRAL DIR ---------------

  //Go to end of file
  let pos = buffer.byteLength - 22; //end of central dir is at least 22 bytes long

  //Find end of central dir
  while (pos >= 0 && dv.getUint32(pos, true) !== SIGNATURE_END_OF_CENTRAL_DIR) {
    pos -= 1;
  }
  if (pos < 0) {
    throw new Error('Could not find end of central dir.');
  }
  pos += 4;

  /** skip 6 bytes:
   * number of this disk,
   * number of the disk with the start of the central directory
   * total number of entries in the central directory on this disk
   */
  pos += 6;

  /** Total number of entries in the central directory */
  const numEntries = dv.getUint16(pos, true); pos += 2;
  /** Size of the central directory */
  const centralDirSize = dv.getUint32(pos, true); pos += 4;
  /** Offset of start of central directory with respect to the starting disk number */
  const centralDirOffset = dv.getUint32(pos, true); pos += 4;
  //ignore .ZIP file comment length

  if (centralDirSize < 46 * numEntries) {
    throw new Error('centralDirSize was smaller than expected in end of central dir.');
  }
  if (pos - centralDirSize < 0) {
    throw new Error(`Central dir points before file start (0x${(pos - centralDirSize).toString(16)})`);
  }

  //--------------- READ CENTRAL DIRECTORY ---------------

  //Go to start of central dir
  pos -= 20 + centralDirSize;
  const posCentralDirStart = pos;

  for (let i = 0; i < numEntries; i += 1) {
    {
      const signature = dv.getUint32(pos, true); pos += 4;
      if (signature !== SIGNATURE_CENTRAL_DIR) {
        throw new Error(`Expected central dir signature but found "0x${signature.toString(16)}"`);
      }
    }

    pos += 4; //skip version made by and version needed to extract

    /** The general purpose bit flag stores whether the file is encrypted or not.
     * Most files are encrypted but there are some exceptions: assets_swtor_test_main_248to249.solidpkg,
     * assets_swtor_test_en_us_270to271.solidpkg, and retailclient_publictest_246to247.solidpkg are not encrypted.
     */
    const bitFlag = dv.getUint16(pos, true); pos += 2;

    /** Compression method, always set to 8 = DEFLATE. */
    const compression = dv.getUint16(pos, true); pos += 2;
    if (compression !== COMPRESSION_DEFLATE) {
      throw new Error(`File is not using DEFLATE compression but "${compression}"`);
    }

    /** last mod file time */
    const lastModTime = dv.getUint16(pos, true); pos += 2;
    /** last mod file date */
    const lastModDate = dv.getUint16(pos, true); pos += 2;
    /** crc-32 */
    const fileCrc = dv.getUint32(pos, true); pos += 4;
    /** compressed size */
    const compressedSize = dv.getUint32(pos, true); pos += 4;
    /** decompressed size */
    const decompressedSize = dv.getUint32(pos, true); pos += 4;
    /** file name length */
    const fileNameLength = dv.getUint16(pos, true); pos += 2;
    /** extra field length */
    const extraFieldLength = dv.getUint16(pos, true); pos += 2;
    /** file comment length */
    const fileCommentLength = dv.getUint16(pos, true); pos += 2;
    /** disk number start */
    const diskNumberStart = dv.getUint16(pos, true); pos += 2; //0=.z01, 1=.z02 etc.
    pos += 6; //skip internal file attributes and external file attributes
    /** relative offset of local header */
    const relOffset = dv.getUint32(pos, true); pos += 4;
    /** file name (variable size) */
    const fileName = Decoder.decode(new DataView(buffer, pos, fileNameLength)); pos += fileNameLength;

    //read password from extra field
    const extraFieldEnd = pos + extraFieldLength;
    let encodedPassword: Uint8Array | undefined;
    let diffType: ISsnFileEntry['diffType'] = -1;
    let diffSourceLength = -1;
    let diffDestLength = -1;
    while (pos + 4 <= extraFieldEnd) {
      const fieldId = dv.getUint16(pos, true); pos += 2;
      const fieldLength = dv.getUint16(pos, true); pos += 2;
      switch (fieldId) {
        case 0x8810: { //password
          if (fieldLength > 120) {
            throw new Error(`Password is too long, it should be 120 characters at most but it is ${fieldLength} characters long.`);
          }
          encodedPassword = new Uint8Array(buffer, pos, fieldLength);
          pos += fieldLength;
          break;
        }
        case 0x80AE: //diff type
          //type: 0 = no diff (usually a new file), 1 = file deleted,  2 = vcdiff/xdelta3, 3=unchanged
          diffType = dv.getUint32(pos, true); pos += 4;
          //size of source file, is actually a uint64 but we only read 32-bits
          diffSourceLength = dv.getUint32(pos, true); pos += 8;
          //size of destination file, is actually a uint64 but we only read 32-bits
          diffDestLength = dv.getUint32(pos, true); pos += 8;
          //skip 20 bytes: hash of old file
          //skip 20 bytes: hash of new file
          pos += 40;
          break;
        default: //unknown field
          pos += fieldLength;
          throw new Error(`Unknown entry in SSN extra field: id "${fieldId}", length "${fieldLength}"`);
      }
    }
    pos += fileCommentLength;

    // ------- CREATE ENTRY ---------

    const fileEntry: ISsnFileEntry = {
      compressedSize,
      crc: fileCrc,
      decryptionKeys: undefined,
      diffDestLength,
      diffSourceLength,
      diffType,
      diskNumberStart,
      lastMod: new Date(1980 + (lastModDate >>> 9), (lastModDate & 0x1E0) >>> 5, lastModDate & 0x1F, lastModTime >>> 11, (lastModTime & 0x7E0) >>> 5, (lastModTime & 0x1F) * 2),
      name: fileName,
      offset: (centralDirOffset > 0) ? //If files are included in this archive, the centralDirOffset will not start from the beginning
        posCentralDirStart - centralDirOffset + relOffset : //if file is in this archive
        relOffset, //if we need to look in a disk (e.g. .z01 for this file)
      size: decompressedSize,
    };

    //If file is encrypted
    if ((bitFlag & 1) !== 0) {
      if (typeof encodedPassword === 'undefined') {
        throw new Error('File was encrypted but could not find password in extra field.');
      }

      const decodedPassword = modifyPassword(encodedPassword);
      fileEntry.decryptionKeys = getDecryptionKeys(decodedPassword);
    }

    fileEntries.push(fileEntry);
  }

  return fileEntries;
}
