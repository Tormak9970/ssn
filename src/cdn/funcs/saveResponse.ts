import * as fs from 'fs';
import * as http from 'http';

export default function saveResponse(
  filePath: string,
  resolve: (fileName: string) => void,
  reject: (reason: string) => void,
  response: http.IncomingMessage,
) {
  //Check that file exists (200 HTTP status code)
  if (response.statusCode !== 200) {
    return reject(`Expected status code 200 but received ${response.statusCode}.`);
  }

  const writeStream = fs.createWriteStream(filePath);

  //If we receive a part of the response, write it to disk
  response.pipe(writeStream);

  //Wait until everything is written to disk, then return file name
  writeStream.on('close', function() {
    resolve(filePath);
  });
}
