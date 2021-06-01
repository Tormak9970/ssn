interface ISolidFile {
  /** Length of this file in bytes, up to 1700000000 or 1.7 GB */
  length: number;
  /** File name of this file, e.g. `${product}_${from}to${to}.z01` or `${product}_${from}to${to}.zip`. */
  path: [string];
}

interface ISolidInfo {
  /** List of files that are part of this torrent. */
  files: ISolidFile[];
  /** Length of one piece in bytes, i.e. 64 KiB, 128 KiB, 256 KiB, 512 KiB, 1 MiB, 2MiB or 4 MiB */
  'piece length': 65536 | 131072 | 262144| 524288 | 1048576| 2097152| 4194304;
  /** Concatenated SHA1 hashes of all pieces, where each hash is 20 bytes (or 40 characters) long. */
  pieces: string;
  /** Whether the torrent is private, always 0. */
  private: 0 | 1;
  /** Whether the torrent is closed, always 1. */
  closed: 0 | 1;
  /** Unique ID of this torrent, e.g. '85ff8715-d1ce-4320-805c-bea80b6dd03c' */
  uniqueid: string;
}

export default interface ISolid {
  /** Timestamp when this torrent was created, given in seconds since 1970. Can be read with `new Date(... * 1000)`. */
  'creation date': number;
  /** Internal tracker URL used to announce this torrent. */
  announce: string;
  /** Title of this torrent in the format `${product}: ${from}to${to}` */
  title: string;
  /** Unknown integer, either 16068 or 16097. */
  networkgroupid: 16068 | 16097;
  /** The URL where the files from this torrent are stored, in the format `http://cdn-patch.swtor.com/patch/${product}/${product}_${from}to${to}/` */
  reliable: string;
  /** Integer in the range 0-3 */
  'reliable-id': '0' | '1' | '2' | '3';
  /** Contains further information about this torrent, including the list of files. */
  info: ISolidInfo;
}
