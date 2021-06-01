import updateKeys from './lib/updateKeys';

export default function getDecryptor(decryptionKeys: [number, number, number]) {
  let [key0, key1, key2] = decryptionKeys;

  return function(chunk: Buffer) {
    for (let i = 0; i < chunk.length; i += 1) {
      //read byte
      let curChar = chunk.readUInt8(i);

      //decrypt byte
      const keyPart = (key2 | 2) & 0xFFFF;
      const decryptedByte = (keyPart * (keyPart ^ 1)) >>> 8;
      curChar ^= decryptedByte & 0xFF;

      //update keys
      [key0, key1, key2] = updateKeys([key0, key1, key2], curChar);

      //write byte
      chunk.writeUInt8(curChar, i);
    }

    return chunk;
  };
}
