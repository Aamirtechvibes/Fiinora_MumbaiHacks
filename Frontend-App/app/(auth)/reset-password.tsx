import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect, Circle, Path } from "react-native-svg";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import useAuth from "../../src/hooks/useAuth";
import { resetSchema } from "../../src/services/dtos/auth.dto";
import { colors } from "../../src/theme/colors";

const { width, height } = Dimensions.get("window");

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { reset } = useAuth();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: token || "",
      password: "",
    },
  });

  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await reset(values);
      Alert.alert("Success", "Password reset successfully. Please log in.");
      router.replace("/(auth)/login");
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
          behavior={Platform.select({
            ios: "padding",
            android: undefined,
          })}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Hero Section */}
            <View style={styles.heroWrap}>
              <Svg
                width={Math.min(width * 0.68, 360)}
                height={height * 0.25}
                viewBox="0 0 200 140"
              >
                <Rect
                  x={56}
                  y={8}
                  width={88}
                  height={120}
                  rx={14}
                  fill="#fff"
                  opacity={0.92}
                />
                <Circle cx={100} cy={12} r={3.6} fill="#E6E7EE" />
                <Rect
                  x={76}
                  y={36}
                  width={48}
                  height={8}
                  rx={4}
                  fill="#EDEBFF"
                />
                <Rect
                  x={76}
                  y={56}
                  width={48}
                  height={8}
                  rx={4}
                  fill="#F3F4F6"
                />
                <Rect
                  x={76}
                  y={76}
                  width={48}
                  height={8}
                  rx={4}
                  fill="#F3F4F6"
                />
                <Path
                  d="M30 110 C 60 80, 140 80, 170 110 L170 130 L30 130 Z"
                  fill="#ffffff"
                  opacity={0.12}
                />
              </Svg>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.logoWrap}>
                  <Text style={styles.logoLetter}>F</Text>
                </View>

                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>Enter your new password</Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Input
                  label="Reset Token"
                  control={control}
                  name="token"
                  placeholder="reset-token"
                  error={errors.token?.message as string}
                />

                <Input
                  label="New Password"
                  control={control}
                  name="password"
                  placeholder="New password"
                  secure
                  error={errors.password?.message as string}
                />

                <Button title="Reset Password" onPress={submit} loading={loading} />
              </View>

              <Pressable
                style={styles.footerLinkWrap}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.footerLink}>Back to login</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 14,
  },

  heroWrap: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: -36,
  },

  card: {
    backgroundColor: "white",
    marginHorizontal: 18,
    borderRadius: CARD_RADIUS,
    padding: 22,
    marginTop: -20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  logoLetter: {
    color: colors.onPrimary,
    fontSize: 26,
    fontWeight: "800",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0b1020",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: 2,
  },

  footerLinkWrap: {
    marginTop: 18,
    alignItems: "center",
  },

  footerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
