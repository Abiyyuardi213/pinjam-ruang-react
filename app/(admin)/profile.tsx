import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from 'react-native';

export default function AdminProfile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Shadcn Theme Colors
  const theme = {
    bg: isDark ? '#09090B' : '#FAFAFA',
    text: isDark ? '#FAFAFA' : '#09090B',
    mutedText: isDark ? '#A1A1AA' : '#71717A',
    border: isDark ? '#27272A' : '#E4E4E7',
    primary: '#2563EB',
    cardBg: isDark ? '#18181A' : '#FFFFFF',
    danger: '#EF4444',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarLarge, { backgroundColor: theme.primary, borderColor: theme.border }]}>
              <ThemedText style={{ fontSize: 32, fontWeight: '700', color: '#FFF' }}>AD</ThemedText>
            </View>
            <ThemedText style={[styles.userName, { color: theme.text }]}>Administrator</ThemedText>
            <ThemedText style={[styles.userEmail, { color: theme.mutedText }]}>admin@kampus.ac.id</ThemedText>
          </View>

          <View style={styles.menuSection}>
            <ThemedText style={[styles.sectionLabel, { color: theme.mutedText }]}>PENGATURAN AKUN</ThemedText>
            <View style={[styles.cardGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <MenuItem icon="person-outline" label="Edit Profil" theme={theme} />
              <MenuItem icon="shield-checkmark-outline" label="Keamanan" theme={theme} />
              <MenuItem icon="notifications-outline" label="Notifikasi" theme={theme} last />
            </View>
          </View>

          <View style={styles.menuSection}>
            <ThemedText style={[styles.sectionLabel, { color: theme.mutedText }]}>UMUM</ThemedText>
            <View style={[styles.cardGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <MenuItem icon="help-circle-outline" label="Bantuan" theme={theme} />
              <MenuItem icon="information-circle-outline" label="Tentang Aplikasi" theme={theme} last />
            </View>
          </View>

          <TouchableOpacity style={[styles.logoutButton, { borderColor: theme.border }]}>
            <ThemedText style={[styles.logoutText, { color: theme.danger }]}>Keluar Sesi</ThemedText>
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MenuItem({ icon, label, last, theme }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={theme.mutedText} />
        <ThemedText style={[styles.menuLabel, { color: theme.text }]}>{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.mutedText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
      padding: 24,
      paddingTop: Platform.OS === 'android' ? 40 : 20, 
  },
  profileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarLarge: { 
    width: 96, 
    height: 96, 
    borderRadius: 48, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
  },
  userName: { fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },
  userEmail: { fontSize: 14, marginTop: 4 },
  menuSection: { marginBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  cardGroup: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, fontWeight: '500' },
  logoutButton: { 
      marginTop: 8, 
      alignItems: 'center', 
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  logoutText: { fontWeight: '600', fontSize: 15 }
});
