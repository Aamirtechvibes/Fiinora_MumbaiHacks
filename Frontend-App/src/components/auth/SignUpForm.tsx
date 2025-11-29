import React from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { registerSchema } from '../../services/dtos/auth.dto';
import type { RegisterDto } from '../../services/dtos/auth.dto';

type Props = {
  onSubmit: (values: RegisterDto) => Promise<void> | void;
  loading?: boolean;
};

export default function SignUpForm({ onSubmit, loading }: Props) {
  const { control, handleSubmit, formState } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '' }
  });
  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <View>
      <Input 
        label="Name" 
        control={control} 
        name="name" 
        placeholder="Your name" 
        error={errors.name?.message as string | undefined} 
      />
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
        placeholder="Password (8+ chars)" 
        secure 
        error={errors.password?.message as string | undefined} 
      />
      <Button title="Create Account" onPress={submit} loading={loading} />
    </View>
  );
}
