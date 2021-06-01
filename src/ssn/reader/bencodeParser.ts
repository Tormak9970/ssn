/**
 * A parser for .torrent files encoded with Bencode <https://en.wikipedia.org/wiki/Bencode>.
 */

/** Takes a Bencode-encoded file, parses it at the given starting position and returns a JSON object, or rejects on error. */
function bpParse(buffer: Buffer, posIn: number = 0): { obj: any, pos: number } {
  let pos = posIn;
  let obj: any;
  const header = buffer.readUInt8(pos); pos += 1;
  switch (header) {
    case 0x64: { //'d' - dictionary (key-value object)
      obj = {};
      do {
        //read key
        const outKey = bpParse(buffer, pos);
        pos = outKey.pos;
        if (typeof outKey.obj !== 'string') {
          throw new Error(`Expected dictionary key to be string but it is "${typeof outKey.obj}".`);
        }
        //read value
        const outValue = bpParse(buffer, pos);
        pos = outValue.pos;
        obj[outKey.obj] = outValue.obj;
      } while (buffer.readUInt8(pos) !== 0x65); //'e' - end
      pos += 1;
      break;
    }
    case 0x6C: { //'l' - list (array)
      obj = [];
      do {
        //read entry
        const out = bpParse(buffer, pos);
        pos = out.pos;
        obj.push(out.obj);
      } while (buffer.readUInt8(pos) !== 0x65); //'e' - end
      pos += 1;
      break;
    }
    case 0x69: { //'i' - integer
      let curChar = buffer.readUInt8(pos); pos += 1;
      let curNumber = 0;
      while (curChar !== 0x65) { //'e' - end
        if (curChar < 0x30 || curChar > 0x39) {
          throw new Error('Unexpected int char during bencode parsing.');
        }
        curNumber *= 10;
        curNumber += curChar - 0x30;
        curChar = buffer.readUInt8(pos); pos += 1;
      }
      obj = curNumber;
      break;
    }
    case 0x30: case 0x31: case 0x32: case 0x33: case 0x34:
    case 0x35: case 0x36: case 0x37: case 0x38: case 0x39: { //string prefixed by length
      //read string length
      let curChar: number = header;
      let strLen = 0;
      while (curChar !== 0x3A) { //':' - integer delimiter, beginning of string
        if (curChar < 0x30 || curChar > 0x39) {
          throw new Error('Unexpected string length during bencode parsing.');
        }
        strLen *= 10;
        strLen += curChar - 0x30;
        curChar = buffer.readUInt8(pos); pos += 1;
      }
      //read string
      obj = buffer.toString('utf-8', pos, pos + strLen);
      pos += strLen;
      break;
    }
    default:
      throw new Error(`Unexpected leading char 0x${header.toString(16)} during Bencode parsing at position ${pos - 1}. Full text:\n${buffer.toString('utf-8')}`);
  }
  return { obj, pos };
}

export default function parseBencode(buffer: Buffer): any {
  return bpParse(buffer).obj;
}
