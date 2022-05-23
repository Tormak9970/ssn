import * as fs from 'fs';
import * as path from 'path';
import downloadWrapper from '../cdn/downloadWrapper';
import createDirRecursively from '../cdn/funcs/createDirRecursively';
import getUrlContents from '../cdn/getUrlContents';
import ISsnFileEntry from '../interfaces/ISsnFileEntry';
import Product from '../interfaces/Product';
import SsnDiffType from '../interfaces/SsnDiffType';
import getSolidpkg from './getSolidpkg';
import launch from './installation/launch';
import taskManager from './installation/taskManager';
import readSsnFile from './reader/readSsnFile';
import verifyPatch from './verify/verifyPatch';
import verifyProductName from './verify/verifyProductName';

interface IGetPatchArgs {
  /** The product that should be patched. */
  product: Product;
  /** The release that we want to patch from, or -1 if patching fresh. */
  from: number;
  /** The release that we want to patch to. */
  to: number;
  /** The source directory where the files from the "from" release are stored. Not needed if from=-1. */
  sourceDirectory: string | undefined;
  /** The target directory where the files should be extracted to. */
  targetDirectory: string;
}

/** Downloads and installs the specified patch. */
export default async function installPatch({ product, from, to, sourceDirectory, targetDirectory }: IGetPatchArgs) {
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

  if (sourceDirectory === undefined && from !== -1) {
    throw new Error('Must specify a sourceDirectory if patching from a release other than -1.');
  }
  const sourceDir = (from === -1) ? '' : path.resolve(sourceDirectory as string);
  const targetDir = path.resolve(targetDirectory);
  await createDirRecursively(targetDir);

  //--------------------------------------------------------------------------------------------------------------
  //Download and verify files

  const solidpkg = await getSolidpkg(product, from, to);

  function createUrlObject({ name, length }: {name: string, length: number}) {
    return {
      host: 'cdn-patch.swtor.com',
      path: `/patch/${product.startsWith('retailclient_') ? `${product.substring(13)}/` : ''}${product}/${product}_${from}to${to}/${name}`,
      size: length,
      useCurl: true,
    };
  }

  //start download, making sure that .zip file downloads first
  const indexOfLastFile = solidpkg.files.length - 1;
  const zipFile = getUrlContents(createUrlObject(solidpkg.files[indexOfLastFile]));
  const diskFiles = solidpkg.files.slice(0, indexOfLastFile).map((file) => async function() { await downloadWrapper(createUrlObject(file)); });

  //we can parse the file entries as soon as the .zip file is downloaded
  const fileEntries = readSsnFile(await zipFile);

  //Verify file entries
  verifyPatch(fileEntries, product, from);

  //Then we need to wait for disks to finish download before we can extract individual files
  //TODO: we can optimize this to already extract some files as soon as their relevant parts are downloaded
  const diskFilenames: string[] = await taskManager(diskFiles, 2); //max. of 2 concurrent downloads

  //TODO: Verify that downloaded files match the hash in `solidpkg.pieces`

  //--------------------------------------------------------------------------------------------------------------
  //Perform the patching

  const extractAdded = async function(file: ISsnFileEntry) {
    try {
      //create file write stream
      const outputName = path.join(targetDir, file.name);
      const outputNameTemp = path.join(targetDir, `${file.name}.tmp`);
      await createDirRecursively(path.dirname(outputNameTemp));

      //start installation
      await launch(diskFilenames[file.diskNumberStart], file.offset, file.compressedSize, file.decryptionKeys, undefined, outputNameTemp);

      fs.rename(outputNameTemp, outputName, function(renameError) {
        if (renameError) {
          throw new Error(`Could not rename output file "${outputNameTemp}": ${renameError.message}`);
        }
      });
    } catch (error) {
      console.error(`Could not extract file "${file.name}"`, error);
    }
  };

  const extractChanged = async function(file: ISsnFileEntry) {
    try {
      const sourceFile = path.join(sourceDir, file.name);
      const outputName = path.join(targetDir, file.name);
      const outputNameTemp = path.join(targetDir, `${file.name}.tmp`);

      //create directory where file is
      await createDirRecursively(path.dirname(outputNameTemp));

      //start installation
      await launch(diskFilenames[file.diskNumberStart], file.offset, file.compressedSize, file.decryptionKeys, sourceFile, outputNameTemp);

      //clean up: delete source file if necessary, and remove .tmp file extension
      if (sourceDir === targetDir) {
        fs.unlink(sourceFile, function(deleteError) {
          if (deleteError) {
            throw new Error(`Could not delete old source file "${sourceFile}": ${deleteError.message}`);
          }
          fs.rename(outputNameTemp, outputName, function(renameError) {
            if (renameError) {
              throw new Error(`Could not rename output file "${outputNameTemp}": ${renameError.message}`);
            }
          });
        });
      } else {
        fs.rename(outputNameTemp, outputName, function(renameError) {
          if (renameError) {
            throw new Error(`Could not rename output file "${outputNameTemp}": ${renameError.message}`);
          }
        });
      }
    } catch (error) {
      console.error(`Could not extract file "${file.name}"`, error);
      //TODO: need to delete .tmp file
    }
  };

  const deleteRemoved = async function(file: ISsnFileEntry) {
    //delete file
    const fileName = path.join(targetDir, file.name);
    fs.unlink(fileName, function(error) {
      if (error) {
        console.error(`Could not delete removed file "${file.name}"`, error);
      }
    });
    //TODO: delete folder (and parent folders) that are empty
  };

  const copyUnchanged = async function(file: ISsnFileEntry) {
    //copy file
    const sourceName = path.join(sourceDir, file.name);
    const targetName = path.join(targetDir, file.name);
    await createDirRecursively(path.dirname(targetName));
    fs.copyFile(sourceName, targetName, function(error) {
      if (error) {
        console.error(`Could not copy unchanged file "${file.name}"`, error);
      }
    });
  };

  const tasks: Array<() => Promise<void>> = [];

  //Extract newly added files
  tasks.push(...fileEntries.filter((file) => file.diffType === SsnDiffType.NewFile).map((file) => extractAdded.bind(null, file)));

  //Extract changed files
  tasks.push(...fileEntries.filter((file) => file.diffType === SsnDiffType.Changed).map((file) => extractChanged.bind(null, file)));

  //Need to delete removed files
  if (sourceDir === targetDir) {
    tasks.push(...fileEntries.filter((file) => file.diffType === SsnDiffType.Deleted).map((file) => deleteRemoved.bind(null, file)));
  }

  //Need to copy unchanged files (if we are patching into a different directory)
  if (sourceDir !== targetDir) {
    tasks.push(...fileEntries.filter((file) => file.diffType === SsnDiffType.Unchanged).map((file) => copyUnchanged.bind(null, file)));
  }

  //run tasks
  try {
    await taskManager(tasks, 3);
  } catch (error) {
    throw error;
  }

  //TODO: add option to delete downloaded files once patching is complete
}
