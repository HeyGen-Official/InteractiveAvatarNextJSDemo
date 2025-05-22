export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertFloat32ToS16PCM(float32Array: Float32Array) {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    const clampedValue = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = clampedValue < 0 ? clampedValue * 32768 : clampedValue * 32767;
  }
  return int16Array;
}