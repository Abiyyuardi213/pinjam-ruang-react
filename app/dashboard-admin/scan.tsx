import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AdminSidebar } from '@/components/ui/admin-sidebar';

import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';

export default function AdminScan() {
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [isCameraActive, setIsCameraActive] = React.useState(true);
  const router = useRouter();
  
  // Force Light Theme
  const isDark = false;

  // Shadcn Light Theme Colors
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    primaryForeground: '#FFFFFF',
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    Toast.show({
      type: 'success',
      text1: 'QR Code Terdeteksi',
      text2: `Data: ${data}`,
    });
    
    // Reset scanner after 2 seconds
    setTimeout(() => setScanned(false), 2000);
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={{ flex: 1, backgroundColor: '#FAFAFA' }} />;
  }

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
              {!permission.granted ? (
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#FFF" style={{ marginBottom: 16 }} />
                    <ThemedText style={{ color: '#FFF', textAlign: 'center', marginBottom: 20 }}>Aplikasi membutuhkan izin kamera untuk memindai QR Code.</ThemedText>
                    <TouchableOpacity 
                        style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
                        onPress={requestPermission}
                    >
                        <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Minta Izin Kamera</ThemedText>
                    </TouchableOpacity>
                </View>
              ) : !isCameraActive ? (
                <View style={styles.inactiveContainer}>
                    <Ionicons name="videocam-off-outline" size={64} color={theme.mutedText} style={{ marginBottom: 16 }} />
                    <ThemedText style={{ color: '#FFF', textAlign: 'center', marginBottom: 20 }}>Kamera Dinonaktifkan</ThemedText>
                    <TouchableOpacity 
                        style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
                        onPress={() => setIsCameraActive(true)}
                    >
                        <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Mulai Scan</ThemedText>
                    </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flex: 1, width: '100%' }}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                    >
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerOutline}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                            <ThemedText style={styles.scanHint}>Posisikan QR Code di dalam kotak</ThemedText>
                        </View>
                    </CameraView>
                    
                    <TouchableOpacity 
                        style={styles.stopBtn}
                        onPress={() => setIsCameraActive(false)}
                    >
                        <Ionicons name="stop-circle" size={20} color="#FFF" />
                        <ThemedText style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Matikan Kamera</ThemedText>
                    </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.manualButton, { borderColor: theme.border }]}
            onPress={() => router.push('/dashboard-admin/peminjaman/create')}
          >
            <ThemedText style={[styles.manualText, { color: theme.text }]}>Input Manual ID Dosen</ThemedText>
          </TouchableOpacity>
        </View>
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
    position: 'relative',
  },
  permissionContainer: {
    padding: 32,
    alignItems: 'center',
  },
  inactiveContainer: {
    padding: 32,
    alignItems: 'center',
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    zIndex: 10,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOutline: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#2563EB',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanHint: {
    color: '#FFF',
    marginTop: 32,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
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
