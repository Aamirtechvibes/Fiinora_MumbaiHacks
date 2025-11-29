import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

type Props<T extends FieldValues> = {
  label?: string;
  control: Control<T>;
  name: FieldPath<T>;
  placeholder?: string;
  secure?: boolean;
  error?: string | null;
};

export default function Input<T extends FieldValues>({
  label,
  control,
  name,
  placeholder,
  secure,
  error,
}: Props<T>) {
  const [show, setShow] = useState(false);
  const isSecure = secure && !show;
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.row}>
            <TextInput
              value={value as string}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              secureTextEntry={isSecure}
              style={[styles.input, error ? styles.errorInput : null]}
              autoCapitalize="none"
            />
            {secure ? (
              <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.toggle}>
                <Text style={styles.toggleText}>{show ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  label: { fontSize: 14, marginBottom: 6, color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 8, fontSize: 16 },
  errorInput: { borderColor: '#DC2626' },
  toggle: { marginLeft: 8, padding: 8 },
  toggleText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  error: { color: '#DC2626', marginTop: 4, fontSize: 12 },
});
