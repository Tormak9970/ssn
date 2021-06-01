import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const processPath = path.join(__dirname, '../../../../../node_modules/ssn-installer/ssn-installer');

export default function launchProcess(
  diskFile: string,
  offset: number,
  compressedSize: number,
  decryptionKeys: [number, number, number] | undefined,
  previousFile: string | undefined,
  output: string | fs.WriteStream,
) {
  return new Promise(function(resolve, reject) {
    const parameters = [
      '--disk', diskFile,
      '--offset', offset,
      '--size', compressedSize,
    ];
    if (decryptionKeys !== undefined) {
      parameters.push('--keys', decryptionKeys.join(','));
    }
    if (previousFile !== undefined) {
      parameters.push('--previous', previousFile);
    }
    if (typeof output === 'string') {
      parameters.push('--target', output);
    }

    const spawnedProcess = childProcess.spawn(processPath, parameters.map((value) => value.toString()));

    if (typeof output === 'string') {
      spawnedProcess.stdout.setEncoding('utf8');
      spawnedProcess.stdout.on('data', function(chunk) {
        console.log(chunk);
      });
    } else {
      spawnedProcess.stdout.pipe(output);
    }
    spawnedProcess.stdout.on('end', resolve);

    spawnedProcess.stderr.setEncoding('utf8');
    spawnedProcess.stderr.on('data', function(error) {
      reject(`Error in process:\n> ${processPath} ${parameters.join(' ')}\n${error}`);
    });
  });
}
