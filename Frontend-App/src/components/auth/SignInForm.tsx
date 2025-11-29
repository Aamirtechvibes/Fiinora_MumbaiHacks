import React from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { loginSchema } from '../../services/dtos/auth.dto';
import type { LoginDto } from '../../services/dtos/auth.dto';

type Props = {
  onSubmit: (values: LoginDto) => Promise<void> | void;
  loading?: boolean;
};

export default function SignInForm({ onSubmit, loading }: Props) {
  const { control, handleSubmit, formState } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    console.log('[SignInForm] LOGIN SENDING PAYLOAD:', JSON.stringify(values, null, 2));
    await onSubmit(values);
  });

  return (
    <View>
      <Input
        label="Email"
        control={control}
        name="email"
        placeholder="you@example.com"
        error={errors.email?.message as string | undefined}
      />
      <Input
        label="Password"
        control={control}
        name="password"
        placeholder="Password"
        secure
        error={errors.password?.message as string | undefined}
      />
      <Button title="Sign In" onPress={submit} loading={loading} />
    </View>
  );
}
