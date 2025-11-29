import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotSchema } from "../../src/services/dtos/auth.dto";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import useAuth from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { forgot } = useAuth();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await forgot(values);
      Alert.alert("Sent!", "Check your email for the reset link.");
      router.push("/(auth)/login");
    } catch (e) {
      // handled by hook
    } finally {
      setLoading(false);
    }
  });

  return (
    <LinearGradient
      colors={["#6C4CE5", "#7B6CF6"]}
      start={[0, 0]}
      end={[1, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* --- TOP TITLE SECTION --- */}
          <View style={styles.heroWrapper}>
            <Text style={styles.heroTitle}>Forgot Password</Text>
            <Text style={styles.heroSubtitle}>
              Enter your email to reset your password
            </Text>
          </View>

          {/* --- CARD --- */}
          <View style={styles.card}>
            <Input
              label="Email"
              control={control}
              name="email"
              placeholder="you@example.com"
              error={errors.email?.message as string | undefined}
            />

            <Button title="Send Reset Link" loading={loading} onPress={submit} />

            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to Login</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 16,
    opacity: 0.9,
    color: "#f3f4f6",
  },

  card: {
    backgroundColor: "white",
    marginTop: 30,
    marginHorizontal: 18,
    borderRadius: 28,
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },

  backLink: {
    marginTop: 22,
    textAlign: "center",
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
