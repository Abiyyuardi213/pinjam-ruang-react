import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard-admin/profile')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Tentang Aplikasi</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.appInfoSection}>
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}>
                <Ionicons name="business" size={48} color="#FFF" />
            </View>
            <ThemedText style={[styles.appName, { color: theme.text }]}>ITATS Pinjam Ruang</ThemedText>
            <ThemedText style={[styles.appVersion, { color: theme.mutedText }]}>Versi 1.0.0 (Prototype)</ThemedText>
          </View>

          <View style={[styles.descCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <ThemedText style={[styles.descText, { color: theme.text }]}>
                Aplikasi ITATS Pinjam Ruang adalah platform digital yang dirancang untuk memudahkan civitas akademika Institut Teknologi Adhi Tama Surabaya dalam mengelola dan memantau penggunaan ruangan kelas serta laboratorium secara real-time.
            </ThemedText>
            <ThemedText style={[styles.descText, { color: theme.text, marginTop: 12 }]}>
                Aplikasi ini memungkinkan admin untuk memantau okupansi ruangan, melakukan peminjaman secara digital, dan melihat sinkronisasi jadwal kuliah secara otomatis.
            </ThemedText>
          </View>

          <View style={styles.footer}>
            <ThemedText style={[styles.copyright, { color: theme.mutedText }]}>
                © 2026 Institut Teknologi Adhi Tama Surabaya
            </ThemedText>
            <ThemedText style={[styles.devText, { color: theme.mutedText }]}>
                Developed by Lab. Sistem Informasi ITATS
            </ThemedText>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 24 },
  appInfoSection: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  appVersion: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  descCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  descText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  footer: { marginTop: 40, alignItems: 'center' },
  copyright: { fontSize: 12, fontWeight: '600' },
  devText: { fontSize: 11, marginTop: 4 },
});
