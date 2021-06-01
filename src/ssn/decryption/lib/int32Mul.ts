//Karatsuba algorithm - https://stackoverflow.com/questions/31087787/javascript-32bit-integer-multiply-simulation
export default function int32Mul(x: number, y: number) {
  // We use B = 2 and m = 16, because it will make sure that we only do multiplications with
  // 16 Bit per factor so that the result must have less than 32 Bit in total (which fits well
  // into a double).
  const bm = 1 << 16;

  const x0 = x % bm;
  const x1 = (x - x0) / bm;
  const y0 = y % bm;
  const y1 = (y - y0) / bm;

  // z1 + z0. We can discard z2 completely as it only contains a value out of our relevant bounds.
  // Both z1 and z0 are 32 Bit, but we shift out the top 16 Bit of z1.
  return (((x1 * y0 + x0 * y1) << 16) + (x0 * y0)) | 0;
}
