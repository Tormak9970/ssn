import getUrlContents from '../cdn/getUrlContents';
import ISolid from '../interfaces/ISolidFile';
import ISolidSimple from '../interfaces/ISolidSimple';
import Product from '../interfaces/Product';
import extractFileAsStream from './extractFileAsStream';
import parseBencode from './reader/bencodeParser';
import readSsnFile from './reader/readSsnFile';
import arrayBufferToStream from './streams/arrayBufferToStream';
import readLocalFileHeader from './streams/readLocalFileHeader';
import streamToArrayBuffer from './streams/streamToArrayBuffer';
import verifyProductName from './verify/verifyProductName';
import verifySolidpkg from './verify/verifySolidpkg';

/** Downloads the .solidpkg file from the given patch,
 * extracts the metafile.solid file inside and returns
 * the contents (list of .zip and .z01 disk files).
 */
export default async function getSolidpkg(product: Product, from: number, to: number): Promise<ISolidSimple> {
  //Verify function arguments
  if (!verifyProductName(product)) {
    throw new TypeError(`"${product}" is not a valid product.`);
  }
  if (typeof from !== 'number' || (from | 0) !== from || from < -1 || from > 999) {
    throw new TypeError(`from must be an integer greater than or equal to -1 but it is "${from}"`);
  }
  if (typeof to !== 'number' || (to | 0) !== to || to < 0 || to > 999) {
    throw new TypeError(`to must be an integer greater than or equal to 0 but it is "${to}"`);
  }

  //Download .solidpkg file
  const ssnFile = await getUrlContents({ host: 'cdn-patch.swtor.com', path: `/patch/${product.startsWith('retailclient_') ? `${product.substring(13)}/` : ''}${product}/${product}_${from}to${to}.solidpkg` });

  //Parse .solidpkg file
  const fileEntries = readSsnFile(ssnFile);

  if (fileEntries.length !== 1) {
    throw new Error(`Expected .solidpkg to contain 1 file but it had "${fileEntries.length}" files.`);
  }

  const firstFile = fileEntries[0];
  if (firstFile.name !== 'metafile.solid') {
    throw new Error(`Expected .solidpkg to contain a file called metafile.solid but it is called "${firstFile.name}".`);
  }

  const stream = arrayBufferToStream(ssnFile, firstFile.offset);

  //Extract metafile.solid file
  await readLocalFileHeader(stream, true);
  const solidFileStream = await extractFileAsStream(firstFile, stream);
  const solidFileArrayBuffer = await streamToArrayBuffer(solidFileStream);
  const solidContents = parseBencode(solidFileArrayBuffer) as ISolid;

  //Verify metafile.solid for correctness
  verifySolidpkg(solidContents, { product, from, to });

  return {
    created: new Date(solidContents['creation date'] * 1000),
    files: solidContents.info.files.map(({ length, path: [name] }) => ({ name, length })),
    pieceLength: solidContents.info['piece length'],
    //pieces: solidContents.info.pieces,
  };
}
