import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function SecurityScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  
  // States
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = React.useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = React.useState(true);

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    inputBg: '#F9FAFB',
    success: '#10B981',
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Harap isi semua kolom password.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Konfirmasi password baru tidak cocok.',
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Password Anda telah diperbarui.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
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
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Keamanan</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Change Password Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.sectionLabel, { color: theme.text }]}>Ubah Password</ThemedText>
            </View>
            
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.inputGroup}>
                    <ThemedText style={[styles.inputLabel, { color: theme.mutedText }]}>PASSWORD SEKARANG</ThemedText>
                    <TextInput
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="••••••••"
                    />
                </View>
                
                <View style={styles.inputGroup}>
                    <ThemedText style={[styles.inputLabel, { color: theme.mutedText }]}>PASSWORD BARU</ThemedText>
                    <TextInput
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="Minimal 8 karakter"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <ThemedText style={[styles.inputLabel, { color: theme.mutedText }]}>KONFIRMASI PASSWORD BARU</ThemedText>
                    <TextInput
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="Ulangi password baru"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.updateBtn, { backgroundColor: theme.primary }]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.updateBtnText}>Update Password</ThemedText>}
                </TouchableOpacity>
            </View>
          </View>

          {/* Extra Security Section */}
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Ionicons name="shield-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.sectionLabel, { color: theme.text }]}>Keamanan Tambahan</ThemedText>
            </View>

            <View style={[styles.cardGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                    <View style={styles.settingLeft}>
                        <ThemedText style={[styles.settingTitle, { color: theme.text }]}>Otentikasi 2 Faktor</ThemedText>
                        <ThemedText style={[styles.settingSub, { color: theme.mutedText }]}>Amankan akun dengan kode verifikasi</ThemedText>
                    </View>
                    <Switch 
                        value={isTwoFactorEnabled} 
                        onValueChange={setIsTwoFactorEnabled} 
                        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                        thumbColor={isTwoFactorEnabled ? theme.primary : '#94A3B8'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <ThemedText style={[styles.settingTitle, { color: theme.text }]}>Login Biometrik</ThemedText>
                        <ThemedText style={[styles.settingSub, { color: theme.mutedText }]}>Gunakan Sidik Jari atau Wajah</ThemedText>
                    </View>
                    <Switch 
                        value={isBiometricEnabled} 
                        onValueChange={setIsBiometricEnabled}
                        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                        thumbColor={isBiometricEnabled ? theme.primary : '#94A3B8'}
                    />
                </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
      <Toast />
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
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 20 },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  updateBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  updateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
});
