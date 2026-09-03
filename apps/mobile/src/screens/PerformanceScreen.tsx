import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { DspSocket } from '../lib/dspSocket';
import { decodePcm16Base64 } from '../lib/pcm';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Performance'>;

const SAMPLE_RATE = 22050;
const ANDROID_VOICE_RECOGNITION_SOURCE = 6;

/**
 * 3.4 DSP Vocal Scoring — captures raw mic PCM and streams it to the DSP
 * service in real time. Requires the RECORD_AUDIO permission (Android
 * manifest / iOS Info.plist NSMicrophoneUsageDescription — add via
 * app.json `permissions`/`infoPlist` once building a real binary) and a
 * custom dev client / bare build: react-native-live-audio-stream ships
 * native code, so it will NOT run inside Expo Go, and is skipped entirely
 * on web (no native module there either — this screen is native-only for
 * the mic capture, web can still preview the layout).
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

    if (Platform.OS === 'web') return () => dspSocketRef.current?.end();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LiveAudioStream = require('react-native-live-audio-stream').default;
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
    <Screen center>
      <Text style={styles.cue}>You're up! Sing along.</Text>
      <Text style={styles.score}>{finalScore ?? liveScore ?? '—'}</Text>
      {finalScore !== null && <Text style={styles.finalLabel}>Final score</Text>}
      <Button title="I'm done singing" onPress={finishSinging} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cue: { color: colors.inkSoft, fontSize: 16 },
  score: { color: colors.gold, fontSize: 72, fontWeight: '800' },
  finalLabel: { color: colors.inkFaint, fontSize: 14, marginTop: -spacing.md },
});
