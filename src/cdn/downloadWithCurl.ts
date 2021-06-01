import * as childProcess from 'child_process';

/** Minimum download speed of 10 MB/s = 80 MBit/s */
const MINIMUM_SPEED = 10;
/** Maximum download speed of 25 MB/s = 200 MBit/s */
const MAXIMUM_SPEED = 25;
/** Time interval over which the minimum speed is measured to determined whether to timeout. Given in seconds. */
const CHECK_INTERVAL = 15;

/**
 * Downloads a file using a curl child process, to allow for speed-limiting and timeout if download is too slow.
 * Takes as input the host domain name, the path and the file size
 */
export default function downloadWithCurl({ host, path, tempFileName }: {host: string, path: string, tempFileName: string}): Promise<string> {
  return new Promise(function(resolve, reject) {
    const url = `http://${host}${(path[0] === '/' ? '' : '/')}${path}`;

    const parameters: string[] = [
      '--continue-at', '-',
      '--silent',
      '--limit-rate', `${MAXIMUM_SPEED}m`,
      '--speed-limit', String(MINIMUM_SPEED * 1024 * 1024),
      '--speed-time', String(CHECK_INTERVAL),
      '--output', tempFileName,
      url,
    ];

    const spawnedProcess = childProcess.spawn('curl', parameters);

    spawnedProcess.stderr.setEncoding('utf8');
    spawnedProcess.stderr.on('data', function(error) {
      reject(`Error in process:\n> curl ${parameters.join(' ')}\n${error}`);
    });

    spawnedProcess.on('exit', function(code) {
      if (code === 0) {
        resolve(tempFileName);
      } else if (code === 28) {
        reject(`Download speed too slow, restarting "${path.includes('/') ? path.substr(path.lastIndexOf('/') + 1) : path}".`);
      } else {
        reject(`Error in process:\n> curl ${parameters.join(' ')}\nNon-zero exit code ${code}.`);
      }
    });
  });
}
