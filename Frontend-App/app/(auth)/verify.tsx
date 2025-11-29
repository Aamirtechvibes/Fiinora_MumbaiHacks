import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAuth from '../../src/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { verifySchema } from '../../src/services/dtos/auth.dto';
import { colors } from '../../src/theme/colors';

export default function Verify() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { verify } = useAuth();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: token || '' }
  });
  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await verify(values);
      Alert.alert('Verified', 'Email verified successfully');
      router.replace('/(auth)/login');
    } catch (e) {
      // handled
    } finally {
      setLoading(false);
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>Enter verification token</Text>
      <Input 
        label="Token" 
        control={control} 
        name="token" 
        placeholder="your-token" 
        error={errors.token?.message as string | undefined} 
      />
      <Button title="Verify" onPress={submit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 32 },
});