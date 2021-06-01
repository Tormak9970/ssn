import getUrlContents from '../cdn/getUrlContents';
import ISsnFileEntry from '../interfaces/ISsnFileEntry';
import Product from '../interfaces/Product';
import getSolidpkg from './getSolidpkg';
import readSsnFile from './reader/readSsnFile';
import verifyPatch from './verify/verifyPatch';

/** Downloads the .solidpkg file from from the given patch
 * to get a the URL of the .zip file, then downloads that
 * zip file, reads the list of file entries and returns
 * them.
 */
export default async function getPatchZip(product: Product, from: number, to: number): Promise<ISsnFileEntry[]> {
  const solidpkg = await getSolidpkg(product, from, to);

  function createUrlObject({ name, length }: {name: string, length: number}) {
    return { host: 'cdn-patch.swtor.com', path: `/patch/${product}/${product}_${from}to${to}/${name}`, size: length };
  }

  //download only last file (the .zip file)
  const indexOfLastFile = solidpkg.files.length - 1;
  const zipFile = getUrlContents(createUrlObject(solidpkg.files[indexOfLastFile]));

  //parse the file entries when .zip file is downloaded
  const fileEntries = readSsnFile(await zipFile);

  //Verify file entries
  verifyPatch(fileEntries, product, from);

  return fileEntries;
}
