import { useEffect, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { DspSocket } from '../lib/dspSocket';
import { decodePcm16Base64 } from '../lib/pcm';

type Props = NativeStackScreenProps<RootStackParamList, 'Performance'>;

const SAMPLE_RATE = 22050;
const ANDROID_VOICE_RECOGNITION_SOURCE = 6;

/**
 * 3.4 DSP Vocal Scoring — captures raw mic PCM and streams it to the DSP
 * service in real time. Requires the RECORD_AUDIO permission (Android
 * manifest / iOS Info.plist NSMicrophoneUsageDescription — add via
 * app.json `permissions`/`infoPlist` once building a real binary) and a
 * custom dev client / bare build: react-native-live-audio-stream ships
 * native code, so it will NOT run inside Expo Go.
 */
export function PerformanceScreen({ route, navigation }: Props) {
  const { queueEntryId, venueId } = route.params;
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const dspSocketRef = useRef<DspSocket | null>(null);

  useEffect(() => {
    const dspSocket = new DspSocket(queueEntryId, venueId, {
      onTick: setLiveScore,
      onFinal: (value) => setFinalScore(value),
      onError: (err) => console.warn('[dsp] socket error', err),
    });
    dspSocketRef.current = dspSocket;

    LiveAudioStream.init({
      sampleRate: SAMPLE_RATE,
      channels: 1,
      bitsPerSample: 16,
      audioSource: ANDROID_VOICE_RECOGNITION_SOURCE,
      bufferSize: 4096,
    });

    LiveAudioStream.on('data', (base64Chunk: string) => {
      const samples = decodePcm16Base64(base64Chunk);
      const chunkDurationSeconds = samples.length / SAMPLE_RATE;
      dspSocket.sendChunk(samples, chunkDurationSeconds).catch((err) => console.warn('[dsp] send failed', err));
    });

    LiveAudioStream.start();

    return () => {
      LiveAudioStream.stop();
      dspSocketRef.current?.end();
    };
  }, [queueEntryId, venueId]);

  function finishSinging() {
    dspSocketRef.current?.end();
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontSize: 16, color: '#666' }}>You're up! Sing along.</Text>
      <Text style={{ fontSize: 64, fontWeight: '700' }}>{finalScore ?? liveScore ?? '—'}</Text>
      {finalScore !== null && <Text>Final score</Text>}
      <Button title="I'm done singing" onPress={finishSinging} />
    </View>
  );
}
