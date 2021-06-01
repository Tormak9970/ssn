import * as fs from 'fs';

/** Checks if this file already exists on the local disk, so we don't need to download it again. */
export default function checkLocalCache(fileName: string, size: number): Promise<boolean> {
  return new Promise(function(resolve, reject) {
    //Check if file already exists
    fs.exists(fileName, function(exists) {
      if (exists) {
        const fileStats = fs.statSync(fileName);
        //check if file size matches
        if (fileStats.size === size) {
          resolve(true);
        } else {
          //TODO: use checksum to verify that file is correct
          if (true) {
            resolve(false);
          } else {
            //file is incorrect; delete it so we can overwrite it
            fs.unlink(fileName, function(error) {
              if (error) {
                reject(error);
              }
              resolve(false);
            });
          }
        }
      } else {
        resolve(false);
      }
    });
  });
}
