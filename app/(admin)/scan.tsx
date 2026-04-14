import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AdminSidebar } from '@/components/ui/admin-sidebar';

export default function AdminScan() {
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
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
    primaryForeground: '#FFFFFF',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <SafeAreaView style={{ flex: 1 }}>
        
        <View style={styles.header}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Scanner Presensi</ThemedText>
            <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
                <Ionicons name="menu" size={28} color={theme.text} />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.scanCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Deteksi QR Code</ThemedText>
              <ThemedText style={[styles.cardDesc, { color: theme.mutedText }]}>Arahkan kamera ke QR Code dosen pengajar untuk memvalidasi presensi ruangan secara otomatis.</ThemedText>
            </View>
            
            <View style={styles.cameraPlaceholder}>
              <View style={styles.scannerOutline}>
                <Ionicons name="scan" size={140} color={theme.primary} style={{ opacity: 0.2 }} />
              </View>
              <ThemedText style={[styles.instruction, { color: theme.primary }]}>Menunggu QR Code...</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.manualButton, { borderColor: theme.border }]}>
            <ThemedText style={[styles.manualText, { color: theme.text }]}>Input Manual ID Dosen</ThemedText>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  menuBtn: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: { 
      padding: 24, 
      flex: 1, 
      justifyContent: 'center',
      paddingBottom: 100, // accommodate floating tab bar
  },
  scanCard: { 
      height: 480, 
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
  },
  cardHeader: {
      padding: 24,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
  },
  cardDesc: {
      fontSize: 13,
      lineHeight: 20,
  },
  cameraPlaceholder: { 
    flex: 1, 
    backgroundColor: '#000000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOutline: {
    padding: 20,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
  },
  manualButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  manualText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
