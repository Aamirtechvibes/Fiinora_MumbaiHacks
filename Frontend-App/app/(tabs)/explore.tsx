import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Discover content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 18, color: colors.muted, marginTop: 8 },
});

