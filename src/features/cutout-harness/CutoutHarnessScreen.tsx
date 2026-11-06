import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Button, FlatList, Image, Share, StyleSheet, Text, View } from 'react-native';

import { cutOutSubject } from '../../../modules/subject-cutout';
import { formatResultsCsv, type PhotoRun } from './formatResultsCsv';

// Internal tool for docs/cutout-protocol.md: never shipped, removed after S2.
const MAX_PHOTOS = 15;
const BACKDROPS = ['#ffffff', '#000000', '#ff00ff'];

type Row = { run: PhotoRun; sourceUri: string };

function errorCodeOf(error: unknown): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return String(error);
}

export function CutoutHarnessScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [backdropIndex, setBackdropIndex] = useState(0);

  const updateRun = (index: number, run: PhotoRun) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, run } : row)));
  };

  const pickAndRun = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS,
      orderedSelection: true,
      quality: 1,
    });
    if (picked.canceled) return;

    const names = picked.assets.map((asset, i) => asset.fileName ?? `photo-${i + 1}`);
    setRows(
      picked.assets.map((asset, i) => ({
        sourceUri: asset.uri,
        run: { name: names[i] ?? '', status: 'pending' },
      })),
    );

    setIsRunning(true);
    // One at a time: the measured duration must be that of a single cutout.
    for (const [i, asset] of picked.assets.entries()) {
      const name = names[i] ?? '';
      updateRun(i, { name, status: 'running' });
      const start = performance.now();
      try {
        const { uri, width, height } = await cutOutSubject(asset.uri);
        const durationMs = performance.now() - start;
        updateRun(i, { name, status: 'done', durationMs, cutoutUri: uri, width, height });
      } catch (error) {
        const durationMs = performance.now() - start;
        updateRun(i, { name, status: 'failed', durationMs, errorCode: errorCodeOf(error) });
      }
    }
    setIsRunning(false);
  };

  const exportCsv = () => {
    Share.share({ message: formatResultsCsv(rows.map((row) => row.run)) });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.actions}>
        <Button title={`Pick up to ${MAX_PHOTOS}`} onPress={pickAndRun} disabled={isRunning} />
        <Button
          title="Backdrop"
          onPress={() => setBackdropIndex((index) => (index + 1) % BACKDROPS.length)}
        />
        <Button title="Export CSV" onPress={exportCsv} disabled={isRunning || rows.length === 0} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item: { run, sourceUri } }) => (
          <View style={styles.row}>
            <Text>
              {run.name} · {run.status}
              {run.status === 'done' || run.status === 'failed'
                ? ` · ${Math.round(run.durationMs)} ms`
                : ''}
              {run.status === 'failed' ? ` · ${run.errorCode}` : ''}
            </Text>
            <View style={styles.images}>
              <Image source={{ uri: sourceUri }} style={styles.image} resizeMode="contain" />
              <View style={[styles.image, { backgroundColor: BACKDROPS[backdropIndex] }]}>
                {run.status === 'done' ? (
                  <Image
                    source={{ uri: run.cutoutUri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#dddddd' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  row: { marginBottom: 16 },
  images: { flexDirection: 'row', gap: 8, marginTop: 4 },
  image: { flex: 1, aspectRatio: 3 / 4 },
});
