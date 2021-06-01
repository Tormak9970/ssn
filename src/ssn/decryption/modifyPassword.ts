/** Takes a password as it is included in the extra field, and returns a password that can be used to decode the file. */
export default function modifyPassword(passwordIn: Uint8Array): Uint8Array {
  const passwordLength = passwordIn.byteLength;
  const passwordOut = new Uint8Array(passwordLength);

  for (let i = 0; i < passwordLength; i += 1) {
    if (passwordIn[i] === 0) { break; }
    let curChar = (passwordIn[i] + ((1 << (i % 32)) & 0xFF)) & 0xFF;
    if (curChar > 0x7E) {
      if (curChar === 0xFF || curChar === 0x7F) {
        curChar = 0x3F;
      } else {
        curChar = curChar & 0x7F;
      }
    }
    if (curChar < 0x21) {
      curChar = ((curChar | (1 << ((curChar % 3) + 5))) + 1) & 0xFF;
    }
    passwordOut[i] = curChar;
  }

  return passwordOut;
}
