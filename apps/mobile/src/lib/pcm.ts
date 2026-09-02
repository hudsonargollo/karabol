import { toByteArray } from 'base64-js';

/** Decodes a base64-encoded little-endian PCM16 chunk (from LiveAudioStream)
 * into Float32 samples normalized to [-1, 1], as the DSP service expects. */
export function decodePcm16Base64(base64: string): Float32Array {
  const bytes = toByteArray(base64);
  const sampleCount = bytes.length / 2;
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const low = bytes[i * 2];
    const high = bytes[i * 2 + 1];
    let value = (high << 8) | low;
    if (value >= 0x8000) value -= 0x10000; // two's complement
    samples[i] = value / 0x8000;
  }

  return samples;
}
