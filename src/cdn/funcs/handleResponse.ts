import * as http from 'http';

/** Too avoid overloading the server, do not allow large files (> 100 MB) to be handled in memory. */
const MAX_MEMORY_SIZE = 100 * 1024 * 1024;

export default function handleResponse(
  resolve: (arrayBuffer: ArrayBuffer) => void,
  reject: (reason: string) => void,
  response: http.IncomingMessage,
) {
  //Check that file exists (200 HTTP status code)
  if (response.statusCode !== 200) {
    return reject(`Expected status code 200 but received ${response.statusCode}.`);
  }

  //Check file size
  const headerLength = Number(response.headers['content-length']);
  if (headerLength > MAX_MEMORY_SIZE) {
    return reject(`File size (${headerLength} bytes) too large to be handled in memory.`);
  }

  //If we receive a part of the response, store it
  const chunkList: Buffer[] = [];
  let totalLength = 0;
  response.on('data', function(chunk: Buffer) {
    totalLength += chunk.length;

    //Exit early if we received too much data
    if (totalLength > headerLength) {
      return reject(`Expected length ${headerLength} but received at least ${totalLength}.`);
    }

    //Add chunk to array
    chunkList.push(chunk);
  });

  //If we finished reading response, check for correctness, then return it
  response.on('end', function() {
    //Check that length is correct
    if (totalLength !== headerLength) {
      return reject(`Expected length ${headerLength} but received ${totalLength}.`);
    }

    //Return file contents as ArrayBuffer
    const fileContents = Buffer.concat(chunkList, totalLength);
    return resolve(fileContents.buffer as ArrayBuffer);
  });
}
