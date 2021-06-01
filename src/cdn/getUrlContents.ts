import * as http from 'http';
import handleResponse from './funcs/handleResponse';

/** Downloads the given URL into memory and returns it as an ArrayBuffer. Throws error if download fails or file is too large to be handled in memory. */
export default function getUrlContents({ host, path }: {host: string, path: string}): Promise<ArrayBuffer> {
  return new Promise(function(resolve, reject) {
    //Create HTTP request
    const request = http.request({
      family: 4,
      host,
      path,
    }, handleResponse.bind(null, resolve, (reason: string) => { request.abort(); reject(reason); }));

    //In case of connection errors, exit early
    request.on('error', function(error) {
      request.abort();
      reject(error);
    });

    request.end();
  });
}
