declare module 'react-native-live-audio-stream' {
  export interface LiveAudioStreamOptions {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number;
    bufferSize?: number;
    wavFile?: string;
  }

  interface LiveAudioStream {
    init(options: LiveAudioStreamOptions): void;
    start(): void;
    stop(): void;
    on(event: 'data', callback: (base64Chunk: string) => void): void;
  }

  const instance: LiveAudioStream;
  export default instance;
}
