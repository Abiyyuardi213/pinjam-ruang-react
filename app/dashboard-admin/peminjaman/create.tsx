import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import Toast from 'react-native-toast-message';

export default function CreatePeminjamanScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [fetchingData, setFetchingData] = React.useState(true);
  
  // Master Data
  const [dosenList, setDosenList] = React.useState<any[]>([]);
  const [roomList, setRoomList] = React.useState<any[]>([]);
  
  // Search State
  const [dosenSearch, setDosenSearch] = React.useState('');
  const [roomSearch, setRoomSearch] = React.useState('');
  
  // Get current time HH:mm
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const [formData, setFormData] = React.useState({
    dosen_id: '',
    ruang_id: '',
    tanggal: now.toISOString().split('T')[0],
    waktu_pinjam: currentTime,
    waktu_kembali: '16:00', // Default end of day
  });

  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    inputBg: '#F9FAFB',
  };

  React.useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setFetchingData(true);
    try {
      const [dosenRes, roomRes] = await Promise.all([
        apiService.getDosen(),
        apiService.getRuang(500)
      ]);
      
      if (dosenRes.success) setDosenList(dosenRes.data);
      if (roomRes.success) setRoomList(roomRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  // Filtered Lists
  const filteredDosen = dosenList.filter(d => 
    (d.dosnama || '').toLowerCase().includes(dosenSearch.toLowerCase()) ||
    (d.dosid || '').toLowerCase().includes(dosenSearch.toLowerCase())
  );

  const filteredRooms = roomList.filter(r => 
    (r.ruangid || '').toLowerCase().includes(roomSearch.toLowerCase()) ||
    (r.ruangket || '').toLowerCase().includes(roomSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.dosen_id || !formData.ruang_id) {
      alert('Mohon pilih dosen dan ruangan');
      return;
    }
    
    setLoading(true);
    
    // Cari nama untuk disimpan agar muncul di list
    const selectedDosen = dosenList.find(d => d.dosid === formData.dosen_id);
    const selectedRoom = roomList.find(r => r.ruangid === formData.ruang_id);
    
    const payload = {
      ...formData,
      dosen_name: selectedDosen?.dosnama || 'N/A',
      ruang_name: selectedRoom?.ruangket || 'N/A'
    };
    
    try {
      await apiService.savePeminjaman(payload);
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Peminjaman Berhasil',
        text2: `Ruang ${selectedRoom?.ruangid} telah dipinjam.`
      });
      router.push('/dashboard-admin/peminjaman');
    } catch (err) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Gagal Menyimpan',
        text2: 'Terjadi kesalahan pada server ITATS'
      });
    }
  };

  if (fetchingData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: 12, color: theme.mutedText }}>Menyiapkan form...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: theme.text }]}>Tambah Peminjaman</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Dosen Section with Search */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Cari Dosen (Peminjam)</ThemedText>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.mutedText} />
              <TextInput 
                placeholder="Nama atau NIP..."
                value={dosenSearch}
                onChangeText={setDosenSearch}
                style={styles.searchTextInput}
              />
            </View>
            <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                {filteredDosen.length > 0 ? filteredDosen.map((dosen) => (
                  <TouchableOpacity 
                    key={dosen.dosid} 
                    style={[
                      styles.pickerItem, 
                      formData.dosen_id === dosen.dosid && { backgroundColor: theme.primary + '10' }
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, dosen_id: dosen.dosid });
                      setDosenSearch(dosen.dosnama);
                    }}
                  >
                    <ThemedText style={{ color: theme.text }}>{dosen.dosnama}</ThemedText>
                    <ThemedText style={{ color: theme.mutedText, fontSize: 11 }}>ID: {dosen.dosid}</ThemedText>
                  </TouchableOpacity>
                )) : (
                  <View style={{ padding: 12 }}><ThemedText style={{ color: theme.mutedText, fontSize: 12 }}>Dosen tidak ditemukan</ThemedText></View>
                )}
              </ScrollView>
            </View>
          </View>

          {/* Room Section with Search */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Cari Ruangan</ThemedText>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.mutedText} />
              <TextInput 
                placeholder="Kode atau Nama Ruang..."
                value={roomSearch}
                onChangeText={setRoomSearch}
                style={styles.searchTextInput}
              />
            </View>
            <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                {filteredRooms.length > 0 ? filteredRooms.map((room) => (
                  <TouchableOpacity 
                    key={room.ruangid} 
                    style={[
                      styles.pickerItem, 
                      formData.ruang_id === room.ruangid && { backgroundColor: theme.primary + '10' }
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, ruang_id: room.ruangid });
                      setRoomSearch(room.ruangid);
                    }}
                  >
                    <ThemedText style={{ color: theme.text }}>{room.ruangid} - {room.ruangket}</ThemedText>
                  </TouchableOpacity>
                )) : (
                  <View style={{ padding: 12 }}><ThemedText style={{ color: theme.mutedText, fontSize: 12 }}>Ruangan tidak ditemukan</ThemedText></View>
                )}
              </ScrollView>
            </View>
          </View>

          {/* Date & Time Section */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>Tanggal (Otomatis)</ThemedText>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, color: theme.mutedText, backgroundColor: '#F1F5F9' }]}
                value={formData.tanggal}
                editable={false}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>Waktu Pinjam (Sekarang)</ThemedText>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, color: theme.mutedText, backgroundColor: '#F1F5F9' }]}
                value={formData.waktu_pinjam}
                editable={false}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <View style={{ height: 40 }} />

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.submitBtnText}>Simpan Peminjaman</ThemedText>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
