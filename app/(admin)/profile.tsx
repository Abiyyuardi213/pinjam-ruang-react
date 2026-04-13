import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminProfile() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <ThemedText style={styles.avatarTextLarge}>AD</ThemedText>
            </View>
            <ThemedText type="title" style={styles.userName}>Administrator</ThemedText>
            <ThemedText style={styles.userEmail}>admin@kampus.ac.id</ThemedText>
          </View>

          <View style={styles.menuSection}>
            <ThemedText style={styles.sectionLabel}>PENGATURAN AKUN</ThemedText>
            <Card>
              <MenuItem icon="person-outline" label="Edit Profil" />
              <MenuItem icon="shield-checkmark-outline" label="Keamanan" />
              <MenuItem icon="notifications-outline" label="Notifikasi" last />
            </Card>
          </View>

          <View style={styles.menuSection}>
            <ThemedText style={styles.sectionLabel}>UMUM</ThemedText>
            <Card>
              <MenuItem icon="help-circle-outline" label="Bantuan" />
              <MenuItem icon="information-circle-outline" label="Tentang Aplikasi" last />
            </Card>
          </View>

          <TouchableOpacity style={styles.logoutButton}>
            <ThemedText style={styles.logoutText}>Keluar Sesi</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MenuItem({ icon, label, last }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, last && { borderBottomWidth: 0 }]}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color="#94A3B8" />
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarLarge: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#1A4FA0', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  avatarTextLarge: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userEmail: { fontSize: 14, opacity: 0.5, marginTop: 4 },
  menuSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, marginLeft: 4 },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#33333320'
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15 },
  logoutButton: { marginTop: 16, alignItems: 'center', padding: 16 },
  logoutText: { color: '#FF4444', fontWeight: 'bold' }
});
