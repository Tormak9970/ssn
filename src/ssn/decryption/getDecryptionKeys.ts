import updateKeys from './lib/updateKeys';

export default function getDecryptionKeys(password: Uint8Array): [number, number, number] {
  let [key0, key1, key2] = [0x12345678, 0x23456789, 0x34567890];
  const passwordLength = password.byteLength;

  //read through password
  for (let i = 0; i < passwordLength; i += 1) {
    const curChar = password[i];

    //Exit early if there's a zero byte in the password
    if (curChar === 0) { break; }

    //update keys
    [key0, key1, key2] = updateKeys([key0, key1, key2], curChar);
  }

  return [key0, key1, key2];
}
