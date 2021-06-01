import * as stream from 'stream';
import getDecryptor from '../decryption/decryptChunk';

export default function decryptTransform(decryptionKeys: [number, number, number]): stream.Transform {
  const decryptor = getDecryptor(decryptionKeys);
  const transform = new stream.Transform({
    transform(chunk, encoding, callback) {
      const decryptedChunk = decryptor(chunk);
      callback(undefined, decryptedChunk);
    },
  });

  return transform;
}
