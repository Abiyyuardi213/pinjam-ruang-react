import { ThemedText } from "@/components/themed-text";
import Toast from "react-native-toast-message";

import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!nip || !password) {
      Toast.show({
        type: "error",
        text1: "Input Kosong",
        text2: "NIP dan Password harus diisi",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[LOGIN] Attempting login for: ${nip}`);
      const response = await apiService.login(nip, password);
      console.log("[LOGIN] Response:", response);

      // Check success based on common ITATS API patterns
      if (response.success || response.token || response.data || response.name) {
        const user = response.user || response.data?.user || response;
        const role =
          user?.role || response.role || (nip.length > 10 ? "dosen" : "admin");

        Toast.show({
          type: "success",
          text1: "Login Berhasil",
          text2: `Selamat datang, ${user?.name || nip}!`,
        });

        // Simpan token dan data user jika ada (untuk web)
        if (Platform.OS === "web") {
          if (response.token) localStorage.setItem("auth_token", response.token);
          localStorage.setItem("user_data", JSON.stringify(user));
        }

        if (role === "admin" || nip.startsWith("CSR")) {
          router.replace("/dashboard-admin");
        } else {
          router.replace("/dosen_dashboard");
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Login Gagal",
          text2: response.message || "Username atau Password salah",
        });
      }
    } catch (error) {
      console.error("Login Error details:", error);

      Toast.show({
        type: "error",
        text1: "Koneksi Gagal",
        text2: "Terjadi kesalahan saat menghubungi server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1E3A8A", "#1E40AF", "#111827"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={50} color="#FFFFFF" />
            </View>
            <ThemedText type="title" style={styles.appName}>
              Pinjam Ruang
            </ThemedText>
            <ThemedText style={styles.appTagline}>
              Sistem Informasi Peminjaman Ruangan
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.loginTitle}>
              Selamat Datang
            </ThemedText>
            <ThemedText style={styles.loginSubtitle}>
              Silakan masuk dengan akun Anda
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NIP / Username</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan NIP Anda"
                  placeholderTextColor="#94A3B8"
                  value={nip}
                  onChangeText={setNip}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <ThemedText style={styles.forgotText}>Lupa Password?</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.loginBtnText}>MASUK</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.footerText}>
            © 2026 ITATS - Pinjam Ruang
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  appName: {
    color: "#FFFFFF",
    letterSpacing: -1, // Sesuai dashboard title
  },
  appTagline: {
    color: "#CBD5E1",
    marginTop: 4,
    opacity: 0.8,
    fontFamily: "Inter_400Regular",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 30,
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  loginTitle: {
    color: "#1E293B",
    marginBottom: 8,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  loginSubtitle: {
    color: "#64748B",
    marginBottom: 30,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#1E293B",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    // Menghilangkan outline default browser di web
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotText: {
    color: "#2563EB",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loginBtn: {
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 40,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
