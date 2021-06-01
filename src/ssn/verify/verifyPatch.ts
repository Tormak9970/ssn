import ISsnFileEntry from '../../interfaces/ISsnFileEntry';
import Product from '../../interfaces/Product';
import SsnDiffType from '../../interfaces/SsnDiffType';

/** Receives a list of file entries from the .zip file and checks them for correctness */
export default function verifyPatch(fileEntries: ISsnFileEntry[], product: Product, from: number): void {
  //There must be at least a .version file
  if (fileEntries.length === 0) {
    throw new Error('Expected at least a *.version file in the .zip file');
  }

  //Check that last file is the .version file with diffType 0.
  const lastFile = fileEntries[fileEntries.length - 1];
  const validLastFileName = `${product}.version`;
  const validLastFileAlternate = `Assets/${product}_version.txt`;
  if (lastFile.name === validLastFileName) {
    if (lastFile.diffType !== SsnDiffType.NewFile) {
      throw new Error(`Last file (.version file) must have diffType 0 but it had diffType ${lastFile.diffType}.`);
    }
  } else if (lastFile.name === validLastFileAlternate) {
    //In some early patches, the last file is *_version.txt and the second to last is *.version
    if (fileEntries.length === 1) {
      throw new Error('Expected at least a *.version file and a *_version.txt file in the .zip file');
    }
    if (lastFile.name !== validLastFileAlternate) {
      throw new Error(`Last file must be called "${validLastFileAlternate}" if it is not *.version but it was "${lastFile.name}".`);
    }
    const secondToLastFile = fileEntries[fileEntries.length - 2];
    if (secondToLastFile.name !== validLastFileName) {
      throw new Error(`Last or second to last file must be called "${validLastFileName}" but it was "${secondToLastFile.name}".`);
    }
    if (secondToLastFile.diffType !== SsnDiffType.Changed) {
      throw new Error(`Second to last file (.version file) must have diffType 2 but it had diffType ${secondToLastFile.diffType}.`);
    }
  } else {
    throw new Error(`Last file must be called "${validLastFileName}" or "${validLastFileAlternate}" but it was "${lastFile.name}".`);
  }

  //Patches from -1 must not have diff type NewFile
  if (from === -1) {
    fileEntries.filter((file) => file.diffType !== SsnDiffType.NewFile).forEach(function(file) {
      throw new Error(`Patches from -1 must be included in full, but this patch had a file "${file.name}" with diff type ${file.diffType}.`);
    });
  }
}
