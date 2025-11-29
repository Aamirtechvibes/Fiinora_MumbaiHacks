import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your preferences</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, marginTop: 8 },
});
