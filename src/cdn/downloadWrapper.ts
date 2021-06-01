import * as os from 'os';
import * as nodePath from 'path';
import patchMasterSource from '../interfaces/PatchMasterSource';
import downloadWithCurl from './downloadWithCurl';
import checkLocalCache from './funcs/checkLocalCache';
import createDirRecursively from './funcs/createDirRecursively';

/** Downloads the given URL and saves it to disk. Returns the location where file is saved under. Throws error if download fails. */
export default async function downloadWrapper({ host, path, size, useCurl }: {host: string, path: string, size: number, useCurl: boolean}): Promise<string> {
  //Generate file name we want to save it under
  //e.g. on Linux: /tmp/patcher/cdn-patch.swtor.com/patch/assets_swtor_main/assets_swtor_main_-1to0/assets_swtor_main_-1to0.zip
  const tempFileName = nodePath.join(os.tmpdir(), 'patcher', host, path);

  //Create parent directory recursively
  const folderName = nodePath.dirname(tempFileName);
  await createDirRecursively(folderName);

  //Check if file already exists locally
  const cacheStatus = await checkLocalCache(tempFileName, size);
  if (cacheStatus) {
    return tempFileName;
  }

  if (useCurl) {
    //Download via curl
    //Try up to 15 times
    for (let i = 0; i < 15; i += 1) {
      try {
        //After five tries from CDN, switch to master source
        const currentHost = (host === 'cdn-patch.swtor.com' && i >= 5 ? patchMasterSource : host);
        const downloadResult = await downloadWithCurl({ host: currentHost, path, tempFileName });
        return downloadResult;
      } catch (err) {
        console.error(err);
        //ignore error and try again
      }
    }
    //Download failed, throw error
    throw new Error('Could not download with curl');
  } else {
    throw new Error('Non-curl download is not yet implemented.');
  }
}
