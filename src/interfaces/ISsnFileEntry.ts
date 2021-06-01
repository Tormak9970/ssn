import SsnDiffType from './SsnDiffType';

export default interface ISsnFileEntry {
  /** CRC-32 checksum of this file. */
  crc: number;
  /** If we only store the differences, the size of the destination file. */
  diffDestLength: number;
  /** If we only store the differences, the size of the source file. */
  diffSourceLength: number;
  /** Whether this file was changed or not, or whether it was newly added or deleted. */
  diffType: SsnDiffType;
  /** The date and time when this file was last modified. */
  lastMod: Date;
  /** File name */
  name: string;
  /** Uncompressed size */
  size: number;
  /** Stored size (size of compressed data + 12 byte encryption header if applicable). Does not include the local ZIP file header, which is slightly longer than 30 bytes. */
  compressedSize: number;
  /** Decryption keys needed to decrypt the file */
  decryptionKeys: [number, number, number] | undefined;
  /** Number of the disk where the file is stored (0=.z01, 1=.z02 etc.) */
  diskNumberStart: number;
  /** Offset into the disk to where the local file header starts. */
  offset: number;
}
