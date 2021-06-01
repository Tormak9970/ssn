interface ISolidSimpleFile {
  /** Name of this file, e.g. `assets_swtor_de_de_-1to0.z01`. */
  name: string;
  /** Length of this file in bytes. */
  length: number;
}

/** Simplified format of the Bencoded metafile.solid file */
export default interface ISolidSimple {
  /** Date and time when this patch was created. */
  created: Date;
  /** List of files included with this patch (.zip, .z01, etc.) */
  files: ISolidSimpleFile[];
  /** Length of one piece in bytes, e.g. 4194304 for 4 MiB. */
  pieceLength: number;
  ///** Concatenated hashes of all pieces. */
  //pieces: string;
}
