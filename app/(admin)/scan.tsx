import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminScan() {
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={{ flex: 1 }}>Scanner Presensi</ThemedText>
          <TouchableOpacity 
            style={styles.menuHandle} 
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="menu-outline" size={32} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Card style={styles.scanCard}>
            <CardHeader>
              <CardTitle>Scanner Kamera</CardTitle>
              <CardDescription>Arahkan kamera ke QR Code Dosen untuk melakukan verifikasi ruangan.</CardDescription>
            </CardHeader>
            <CardContent style={styles.cameraPlaceholder}>
              <View style={styles.scannerOutline}>
                <Ionicons name="scan-outline" size={120} color="#1A4FA0" opacity={0.3} />
              </View>
              <ThemedText style={styles.instruction}>Menunggu QR Code...</ThemedText>
            </CardContent>
          </Card>
          
          <TouchableOpacity style={styles.manualButton}>
            <ThemedText style={styles.manualText}>Input Manual (ID Dosen)</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  menuHandle: {
    padding: 8,
    marginLeft: -8,
  },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  scanCard: { height: 450, justifyContent: 'space-between' },
  cameraPlaceholder: { 
    flex: 1, 
    backgroundColor: '#000', 
    margin: 16, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A4FA030',
  },
  scannerOutline: {
    padding: 40,
  },
  instruction: {
    color: '#1A4FA0',
    fontSize: 12,
    marginTop: 20,
    fontWeight: '600',
  },
  manualButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
  },
  manualText: {
    color: '#1A4FA0',
    fontSize: 14,
    fontWeight: '500',
  }
});
