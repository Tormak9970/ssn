import * as fs from 'fs';
import * as path from 'path';

/** Recursively creates the given directory. */
export default function createDirRecursively(folderName: string): Promise<void> {
  return new Promise(function(resolve, reject) {
    //Try to create directory
    fs.mkdir(folderName, function(error) {
      //If it fails, we first need to create parent directory
      if (error) {
        switch (error.code) {
          case 'ENOENT': //parent does not exist
            //Create parent
            const parentFolder = path.dirname(folderName);
            createDirRecursively(parentFolder).then(function() {
              //Then try again
              try {
                resolve(createDirRecursively(folderName));
              } catch (error) {
                reject(error);
              }
            }).catch(function(parentError) {
              reject(parentError);
            });
            break;

          case 'EEXIST': { //already exists (either as file or directory)
            fs.stat(folderName, function(statError, stats) {
              if (statError) {
                reject(statError);
              }
              if (stats.isDirectory()) {
                resolve();
              } else {
                reject('Is not a directory');
              }
            });
            break;
          }

          default: //other error, just propagate onwards
            reject(error);
        }
      } else {
        resolve();
      }
    });
  });
}
