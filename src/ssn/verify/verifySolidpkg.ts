import ISolid from '../../interfaces/ISolidFile';

/** Verifies metafile.solid for correctness. See specification at <http://www.bittorrent.org/beps/bep_0003.html>. */
export default function verifySolidpkg(file: ISolid, { product, from, to }: {product: string, from: number, to: number}): void {
  if (typeof file['creation date'] !== 'number') {
    throw new Error(`Expected creation date to be a number but it was "${file['creation date']}".`);
  }
  //used by most .solidpkg files
  const announceGeneral = /^http:\/\/Tracker22\.[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}\.automated\.(?:tel\.swtor\.com|ssntracker\.int):80\/$/;
  //used by retailclient_swtor_-1to0
  const announceRetailclientSwtor = /^http:\/\/Tracker14\.[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}\.automated\.snxd\.com:2500\/$/;
  if (file.announce.match(announceGeneral) === null && file.announce.match(announceRetailclientSwtor) === null) {
    throw new Error(`Expected announce URL but it was "${file.announce}".`);
  }
  if (file.title !== `${product}: ${from}to${to}`) {
    throw new Error(`Expected title "${product}: ${from}to${to}" but it was "${file.title}".`);
  }
  if (![16068, 16097].includes(file.networkgroupid)) {
    throw new Error(`Expected networkgroupid 16068 or 16097 but it was "${file.networkgroupid}".`);
  }
  if (file.reliable !== `http://cdn-patch.swtor.com/patch/${product.startsWith('retailclient_') ? `${product.substring(13)}/` : ''}${product}/${product}_${from}to${to}/`) {
    throw new Error(`Expected reliable URL but it was "${file.reliable}".`);
  }
  if (!(['0', '1', '2', '3']).includes(file['reliable-id'])) {
    throw new Error(`Expected reliable-id to be an integer in range 0-3 but it was "${file['reliable-id']}".`);
  }

  if (file.info === undefined) {
    throw new Error(`Expected info field but it was missing.`);
  }

  if (!Array.isArray(file.info.files)) {
    throw new Error(`Expected files field to be an array but it isn't.`);
  }

  if (file.info.files.length < 2) {
    throw new Error(`Expected files array to contain at least two files but it had ${file.info.files.length} files.`);
  }

  for (let i = 0, il = file.info.files.length; i < il; i += 1) {
    const fileEntry = file.info.files[i];
    if (typeof fileEntry.length !== 'number' && fileEntry.length >= 0 && fileEntry.length <= 1700000000) {
      throw new Error(`Expected file length to be a number but it was ${fileEntry.length}.`);
    }
    if (!Array.isArray(fileEntry.path) || fileEntry.path.length !== 1) {
      throw new Error(`Expected valid file name but it was not an array with one element.`);
    }
    const fileName = fileEntry.path[0];
    if (typeof fileName !== 'string') {
      throw new Error(`Expected valid file name to be a string but it was a ${typeof fileName}.`);
    }
    //Last file must end with .zip, other files are called .z01, .z02 etc.
    const validExtension = (i === il - 1) ? 'ip' : String(i + 1).padStart(2, '0');
    const validName = `${product}_${from}to${to}.z${validExtension}`;
    if (fileName !== validName) {
      throw new Error(`Expected file name "${validName}" but it was "${fileName}".`);
    }
  }

  //64 KiB, 128 KiB, 256 KiB, 512 KiB, 1 MiB, 2 MiB, 4 MiB
  if (!([0x1_0000, 0x2_0000, 0x4_0000, 0x8_0000, 0x10_0000, 0x20_0000, 0x40_0000]).includes(file.info['piece length'])) {
    throw new Error(`Expected piece length to be "65536", "131072", 262144", 524288", "1048576", "2097152" or "4194304" but it was "${file.info['piece length']}".`);
  }
  if (typeof file.info.pieces !== 'string') {
    throw new Error(`Expected pieces to be a string but it was "${file.info.pieces}".`);
  }
  if (file.info.private !== 0) {
    throw new Error(`Expected file to not be private ("0") but it was "${file.info.private}".`);
  }
  if (file.info.closed !== 1) {
    throw new Error(`Expected file to be closed ("1") but it was "${file.info.closed}".`);
  }
  if (typeof file.info.uniqueid !== 'string') {
    throw new Error(`Expected uniqueid to be a string but it was "${file.info.uniqueid}".`);
  }
}
