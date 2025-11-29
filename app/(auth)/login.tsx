import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";

import useAuth from "../../src/hooks/useAuth";
import SignInForm from "../../src/components/auth/SignInForm";
import { colors } from "../../src/theme/colors";
import type { LoginDto } from "../../src/services/dtos/auth.dto";

const { width } = Dimensions.get("window");

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (values: LoginDto) => {
    setLoading(true);
    try {
      await login(values);
      // Fallback: ensure navigation to main tabs if hook routing didn't take effect
      try {
        router.replace('/(tabs)');
      } catch (e) {
        console.debug('[Login] Fallback navigation failed', e);
      }
    } catch {}
    setLoading(false);
  };

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
          {/* ---------- HERO ILLUSTRATION ---------- */}
          <View style={styles.heroWrapper}>
            <Svg width={width * 0.6} height={220} viewBox="0 0 200 200">
              <Rect
                x={65}
                y={20}
                width={70}
                height={140}
                rx={15}
                fill="#ffffff"
                opacity={0.9}
              />
              <Circle cx={100} cy={15} r={4} fill="#d1d5db" />
              <Rect x={80} y={50} width={40} height={8} rx={4} fill="#c7c9ff" />
              <Rect x={80} y={70} width={40} height={8} rx={4} fill="#e5e7eb" />
              <Rect x={80} y={90} width={40} height={8} rx={4} fill="#e5e7eb" />
              <Path
                d="M140 170 L170 200 L110 200 Z"
                fill="#ffffff"
                opacity={0.2}
              />
              <Circle cx={150} cy={40} r={6} fill="#ffffff" opacity={0.3} />
              <Circle cx={50} cy={160} r={10} fill="#ffffff" opacity={0.15} />
            </Svg>
          </View>

          {/* ---------- CARD ---------- */}
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to your account</Text>

            <SignInForm loading={loading} onSubmit={handleSubmit} />

            <View style={styles.row}>
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>

            <View style={styles.socialContainer}>
              <Text style={styles.or}>Or sign in with</Text>

              <View style={styles.socialRow}>
                <View style={styles.socialBtn}>
                  <Text style={styles.socialText}>f</Text>
                </View>
                <View style={styles.socialBtn}>
                  <Text style={styles.socialText}>G</Text>
                </View>
                <View style={styles.socialBtn}>
                  <Text style={styles.socialText}>in</Text>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: -40,
  },

  card: {
    backgroundColor: "white",
    marginHorizontal: 18,
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subheading: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },

  row: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  socialContainer: {
    marginTop: 26,
    alignItems: "center",
  },
  or: {
    color: "#9CA3AF",
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  socialText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
});
