import getCrc from './getCrc';
import int32Mul from './int32Mul';

export default function updateKeys([key0, key1, key2]: [number, number, number], curChar: number): [number, number, number] {
  key0 = getCrc(key0, curChar);
  key1 = ((int32Mul((((key1 >>> 0) + ((key0 >>> 0) & 0xFF)) >>> 0), 134775813) >>> 0) + 1) >>> 0;
  key2 = getCrc(key2, key1 >>> 24);

  return [key0, key1, key2];
}
