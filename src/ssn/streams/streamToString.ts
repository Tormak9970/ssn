import * as stream from 'stream';

export default function streamToString(inputStream: stream.Readable): Promise<string> {
  const decoder = new TextDecoder('utf-8');

  return new Promise(function(resolve, reject) {
    const stringParts: string[] = [];

    //Convert chunks to string
    inputStream.on('data', function(chunk: Buffer) {
      stringParts.push(decoder.decode(chunk, { stream: true }));
    });

    //Output final string
    inputStream.on('end', function() {
      stringParts.push(decoder.decode());
      resolve(stringParts.join(''));
    });

    //Exit on error
    inputStream.on('error', function(error) {
      reject(error);
    });
  });
}
