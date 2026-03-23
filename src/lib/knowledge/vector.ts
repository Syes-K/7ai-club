/** L2 归一化；零向量保持为零（避免除零）。 */
export function l2Normalize(v: number[]): number[] {
  let s = 0;
  for (const x of v) s += x * x;
  const norm = Math.sqrt(s);
  if (norm === 0) return v.slice();
  return v.map((x) => x / norm);
}

/** 标准点积；存库向量与查询向量均已归一化时，结果等于余弦相似度。 */
export function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function float32ArrayToBuffer(arr: Float32Array): Buffer {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function bufferToFloat32Array(buf: Buffer): Float32Array {
  const copy = Buffer.from(buf);
  return new Float32Array(
    copy.buffer,
    copy.byteOffset,
    copy.length / Float32Array.BYTES_PER_ELEMENT
  );
}

export function numberArrayToFloat32Buffer(values: number[]): Buffer {
  return float32ArrayToBuffer(new Float32Array(values));
}
