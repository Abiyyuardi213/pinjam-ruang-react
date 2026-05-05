import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Platform, StatusBar, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AdminSidebar } from '@/components/ui/admin-sidebar';

import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { apiService } from '@/services/api';

import { AdminHeader } from '@/components/ui/admin-header';

export default function AdminScan() {
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [isCameraActive, setIsCameraActive] = React.useState(true);
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [lecturers, setLecturers] = React.useState<any[]>([]);
  const [step, setStep] = React.useState(1); // 1: Scan Ruang, 2: Scan Dosen
  const [scanMode, setScanMode] = React.useState<'pinjam' | 'kembali'>('pinjam'); // Mode Scan
  const [selectedRoom, setSelectedRoom] = React.useState<any>(null);
  const [errorModal, setErrorModal] = React.useState({
    visible: false,
    title: '',
    message: '',
    type: 'error' as 'error' | 'success'
  });
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

  React.useEffect(() => {
    fetchMasterData();
  }, []);
  
  const fetchMasterData = async () => {
    try {
      const [ruangResp, dosenResp] = await Promise.all([
        apiService.getRuang(500),
        apiService.getDosen()
      ]);
      
      if (ruangResp.success) {
        setRooms(ruangResp.data?.data || ruangResp.data || []);
      }
      
      if (dosenResp.success) {
        setLecturers(dosenResp.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch master data for scanner", e);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || !data) return;
    setScanned(true);

    // Trim data to avoid hidden characters
    const rawData = String(data).trim();
    console.log(`[SCANNER] Scanned (${step}): ${rawData}`);

    // Pastikan data ruangan sudah siap
    if (rooms.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Mohon Tunggu',
        text2: 'Sedang mensinkronkan data database...',
      });
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    if (step === 1) {
      // --- TAHAP 1: SCAN RUANG ---
      let targetId = rawData;
      
      // Handle format itatsqr1:r:RUANG_ID
      if (rawData.toLowerCase().startsWith('itatsqr1:r:')) {
        const parts = rawData.split(':');
        if (parts.length >= 3) targetId = parts[2];
      }

      const foundRoom = rooms.find(r => 
        String(r.ruangid || r.nama_ruang || '').trim().toLowerCase() === targetId.trim().toLowerCase()
      );

      if (foundRoom) {
        setSelectedRoom(foundRoom);
        Toast.show({
          type: 'success',
          text1: 'Tahap 1 Berhasil',
          text2: `Ruang: ${foundRoom.ruangket || foundRoom.ruangid}. Lanjut scan Dosen.`,
          visibilityTime: 3000,
        });
        setStep(2);
      } else {
        setErrorModal({
          visible: true,
          title: 'Ruang Tidak Dikenal',
          message: `ID Ruangan "${targetId}" tidak ditemukan dalam database ITATS. Pastikan Anda melakukan scan pada label QR yang benar.`,
          type: 'error'
        });
      }
      // Re-enable scanner after delay
      setTimeout(() => setScanned(false), 2500);

    } else {
      // --- TAHAP 2: SCAN DOSEN/PEMINJAM ---
      let dosenId = rawData;

      // Handle format itatsqr1:d:DOSEN_ID
      if (rawData.toLowerCase().startsWith('itatsqr1:d:')) {
        const parts = rawData.split(':');
        if (parts.length >= 3) dosenId = parts[2];
      }

      // Cari data dosen di master data
      const foundDosen = lecturers.find(d => 
        String(d.dosid).trim().toLowerCase() === dosenId.trim().toLowerCase()
      );

      if (!foundDosen && scanMode === 'pinjam') {
        setErrorModal({
          visible: true,
          title: 'Dosen Tidak Terdaftar',
          message: `ID Dosen "${dosenId}" tidak ditemukan. Pastikan data dosen sudah diinput oleh Superadmin atau sinkronisasi ulang data.`,
          type: 'error'
        });
        setTimeout(() => setScanned(false), 2500);
        return;
      }

      Toast.show({
        type: 'info',
        text1: scanMode === 'pinjam' ? 'Memproses Peminjaman...' : 'Memproses Pengembalian...',
        text2: `Dosen: ${foundDosen?.dosnama || dosenId}`,
      });

      try {
        if (scanMode === 'pinjam') {
          // --- LOGIKA PINJAM ---
          const today = new Date().toISOString().split('T')[0];
          const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

          const payload = {
            dosen_id: dosenId,
            ruang_id: selectedRoom.ruangid,
            tanggal: today,
            waktu_pinjam: now,
            dosen_name: foundDosen?.dosnama || 'N/A',
            ruang_name: selectedRoom?.ruangket || 'N/A'
          };

          const res = await apiService.savePeminjaman(payload);

          if (res.success) {
            Toast.show({ type: 'success', text1: 'Peminjaman Berhasil', text2: 'Data telah disimpan.' });
            setStep(1); setSelectedRoom(null);
            router.replace('/dashboard-admin/peminjaman');
          } else {
            throw new Error(res.message);
          }
        } else {
          // --- LOGIKA KEMBALI ---
          const historyRes = await apiService.getPeminjaman();
          
          if (historyRes.success) {
            const activeRecord = historyRes.data.find((item: any) => 
              String(item.ruang_id) === String(selectedRoom.ruangid) && 
              String(item.dosen_id) === String(dosenId) &&
              (item.status === 'Dipinjam' || !item.waktu_kembali)
            );

            if (activeRecord) {
              const res = await apiService.updateStatus(activeRecord.id);
              if (res.success) {
                Toast.show({ type: 'success', text1: 'Pengembalian Berhasil', text2: 'Kunci telah diterima.' });
                setStep(1); setSelectedRoom(null);
                router.replace('/dashboard-admin/peminjaman');
              } else {
                throw new Error(res.message);
              }
            } else {
              throw new Error("Tidak ditemukan data peminjaman aktif untuk Dosen & Ruangan ini.");
            }
          }
        }
      } catch (error: any) {
        setErrorModal({
          visible: true,
          title: 'Gagal Memproses',
          message: error.message || 'Terjadi kesalahan sistem saat menghubungi server ITATS. Mohon periksa koneksi internet Anda.',
          type: 'error'
        });
        setScanned(false);
      }
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={{ flex: 1, backgroundColor: '#FAFAFA' }} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
        <AdminHeader 
          title="Validasi QR"
          subtitle="Input Transaksi Kunci ITATS"
          showMenu={true}
          onMenuPress={() => setSidebarVisible(true)}
        />


        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Segmented Control */}
          <View style={styles.modeWrapper}>
            <View style={styles.segmentedControl}>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.segmentBtn, scanMode === 'pinjam' && { backgroundColor: theme.primary, elevation: 4 }]} 
                    onPress={() => { setScanMode('pinjam'); setStep(1); setSelectedRoom(null); }}
                >
                    <Ionicons name="enter" size={18} color={scanMode === 'pinjam' ? '#FFF' : '#94A3B8'} />
                    <ThemedText style={[styles.segmentText, { color: scanMode === 'pinjam' ? '#FFF' : '#94A3B8' }]}>PINJAM</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.segmentBtn, scanMode === 'kembali' && { backgroundColor: '#EF4444', elevation: 4 }]} 
                    onPress={() => { setScanMode('kembali'); setStep(1); setSelectedRoom(null); }}
                >
                    <Ionicons name="exit" size={18} color={scanMode === 'kembali' ? '#FFF' : '#94A3B8'} />
                    <ThemedText style={[styles.segmentText, { color: scanMode === 'kembali' ? '#FFF' : '#94A3B8' }]}>KEMBALI</ThemedText>
                </TouchableOpacity>
            </View>
          </View>

          {/* Scanner Card */}
          <View style={styles.scannerWrapper}>
            <View style={styles.mainScanCard}>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <View>
                    <ThemedText style={styles.stepTitle}>
                      {step === 1 ? 'Langkah 1: Ruangan' : 'Langkah 2: Peminjam'}
                    </ThemedText>
                    <ThemedText style={styles.stepDesc}>
                      {step === 1 
                        ? 'Scan QR Code pada pintu ruang' 
                        : 'Scan QR identitas peminjam'}
                    </ThemedText>
                  </View>
                  <View style={[styles.stepIndicator, { backgroundColor: scanMode === 'pinjam' ? '#DBEAFE' : '#FEE2E2' }]}>
                     <ThemedText style={[styles.stepIndicatorText, { color: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]}>
                        {step}/2
                     </ThemedText>
                  </View>
                </View>
                
                {step === 2 && selectedRoom && (
                  <View style={[styles.roomPill, { backgroundColor: scanMode === 'pinjam' ? '#EFF6FF' : '#FEF2F2' }]}>
                    <Ionicons name="business" size={14} color={scanMode === 'pinjam' ? theme.primary : '#EF4444'} />
                    <ThemedText style={[styles.roomPillText, { color: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]}>
                      Ruang Terpilih: {selectedRoom.ruangid}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              <View style={styles.cameraBox}>
                {!permission.granted ? (
                  <View style={styles.statusBox}>
                      <Ionicons name="camera" size={48} color="#FFF" style={{ marginBottom: 12 }} />
                      <ThemedText style={styles.statusBoxText}>Butuh Akses Kamera</ThemedText>
                      <TouchableOpacity style={styles.statusBtn} onPress={requestPermission}>
                          <ThemedText style={styles.statusBtnText}>Izinkan</ThemedText>
                      </TouchableOpacity>
                  </View>
                ) : !isCameraActive ? (
                  <View style={styles.statusBox}>
                      <Ionicons name="videocam-off" size={48} color="#64748B" style={{ marginBottom: 12 }} />
                      <ThemedText style={styles.statusBoxText}>Kamera Nonaktif</ThemedText>
                      <TouchableOpacity style={styles.statusBtn} onPress={() => setIsCameraActive(true)}>
                          <ThemedText style={styles.statusBtnText}>Aktifkan</ThemedText>
                      </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cameraContainer}>
                      <CameraView
                          style={StyleSheet.absoluteFillObject}
                          facing="back"
                          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      >
                          <View style={styles.overlay}>
                              <TouchableOpacity style={styles.closeCamBtn} onPress={() => setIsCameraActive(false)}>
                                  <Ionicons name="close" size={20} color="#FFF" />
                              </TouchableOpacity>

                              <View style={styles.focusFrame}>
                                  <View style={[styles.corner, styles.tl, { borderColor: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]} />
                                  <View style={[styles.corner, styles.tr, { borderColor: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]} />
                                  <View style={[styles.corner, styles.bl, { borderColor: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]} />
                                  <View style={[styles.corner, styles.br, { borderColor: scanMode === 'pinjam' ? theme.primary : '#EF4444' }]} />
                              </View>
                              <ThemedText style={styles.helperText}>Scan QR Code dengan kotak di atas</ThemedText>
                          </View>
                      </CameraView>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.manualEntryBtn}
              onPress={() => router.push('/dashboard-admin/peminjaman/create')}
            >
              <Ionicons name="keypad" size={20} color="#1E293B" />
              <ThemedText style={styles.manualEntryText}>Input Manual ID Peminjam</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Extreme Bottom Padding for Floating Navbar */}
          <View style={{ height: 180 }} />
        </ScrollView>
      <Toast />

      {/* Error/Status Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModal.visible}
        onRequestClose={() => setErrorModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={[styles.modalIconBox, { backgroundColor: errorModal.type === 'error' ? '#FEF2F2' : '#F0FDF4' }]}>
                <Ionicons 
                  name={errorModal.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={48} 
                  color={errorModal.type === 'error' ? '#EF4444' : '#22C55E'} 
                />
             </View>
             
             <ThemedText style={styles.modalTitle}>{errorModal.title}</ThemedText>
             <ThemedText style={styles.modalMessage}>{errorModal.message}</ThemedText>
             
             <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: errorModal.type === 'error' ? '#EF4444' : theme.primary }]}
              onPress={() => setErrorModal(prev => ({ ...prev, visible: false }))}
             >
                <ThemedText style={styles.modalBtnText}>Tutup</ThemedText>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 24,
  },
  modeWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 16,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scannerWrapper: {
    paddingHorizontal: 24,
  },
  mainScanCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  cardInfo: {
    padding: 24,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  stepDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  stepIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '900',
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  roomPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cameraBox: {
    height: 320,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
  },
  statusBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  statusBoxText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCamBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  focusFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  tl: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 20 },
  helperText: {
    color: '#FFF',
    marginTop: 32,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
  },
  manualEntryBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualEntryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#09090B',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
