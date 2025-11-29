import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, GestureResponderEvent, StyleSheet } from 'react-native';

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export default function Button({ title, onPress, disabled, loading, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, variant === 'secondary' ? styles.secondary : styles.primary, disabled ? styles.disabled : null]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#E5E7EB' },
  text: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
