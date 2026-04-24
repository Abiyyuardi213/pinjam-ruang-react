import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import Toast from 'react-native-toast-message';

export default function EditPeminjamanScreen() {
  const router = useRouter();
  const { id, data: initialDataStr } = useLocalSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [fetchingData, setFetchingData] = React.useState(true);
  
  // Master Data
  const [dosenList, setDosenList] = React.useState<any[]>([]);
  const [roomList, setRoomList] = React.useState<any[]>([]);
  
  // Search State
  const [dosenSearch, setDosenSearch] = React.useState('');
  const [roomSearch, setRoomSearch] = React.useState('');
  
  const [formData, setFormData] = React.useState({
    dosen_id: '',
    ruang_id: '',
    tanggal: '',
    waktu_pinjam: '',
    waktu_kembali: '',
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
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setFetchingData(true);
    try {
      // 1. Load Master Data
      const [dosenRes, roomRes] = await Promise.all([
        apiService.getDosen(),
        apiService.getRuang()
      ]);
      
      if (dosenRes.success) setDosenList(dosenRes.data);
      if (roomRes.success) setRoomList(roomRes.data);

      // 2. Parse Initial Data if available
      if (initialDataStr) {
        const item = JSON.parse(initialDataStr as string);
        setFormData({
            dosen_id: item.dosen_id,
            ruang_id: item.ruang_id,
            tanggal: item.tanggal,
            waktu_pinjam: item.waktu_pinjam,
            waktu_kembali: item.waktu_kembali || '',
        });
        setDosenSearch(item.dosen_name);
        setRoomSearch(item.ruang_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.show({ type: 'error', text1: 'Gagal memuat data' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.dosen_id || !formData.ruang_id) {
      alert('Mohon pilih dosen dan ruangan');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiService.updatePeminjaman(id as string, formData);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Update Berhasil',
          text2: 'Data peminjaman telah diperbarui di server ITATS.'
        });
        // Ganti back() dengan navigasi eksplisit ke daftar peminjaman
        router.replace('/dashboard-admin/peminjaman');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Gagal Update',
        text2: err.message || 'Terjadi kesalahan pada server'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: 12, color: theme.mutedText }}>Memuat data peminjaman...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/dashboard-admin/peminjaman')} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: theme.text }]}>Edit Peminjaman</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Dosen (Peminjam)</ThemedText>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.mutedText} />
              <TextInput 
                placeholder="Cari Dosen..."
                value={dosenSearch}
                onChangeText={setDosenSearch}
                style={styles.searchTextInput}
              />
            </View>
            <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
              <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled={true}>
                {dosenList.filter(d => (d.dosnama || '').toLowerCase().includes(dosenSearch.toLowerCase())).slice(0, 10).map((dosen) => (
                  <TouchableOpacity 
                    key={dosen.dosid} 
                    style={[styles.pickerItem, formData.dosen_id === dosen.dosid && { backgroundColor: theme.primary + '10' }]}
                    onPress={() => {
                      setFormData({ ...formData, dosen_id: dosen.dosid });
                      setDosenSearch(dosen.dosnama);
                    }}
                  >
                    <ThemedText style={{ color: theme.text }}>{dosen.dosnama}</ThemedText>
                    <ThemedText style={{ color: theme.mutedText, fontSize: 11 }}>ID: {dosen.dosid}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Ruangan</ThemedText>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.mutedText} />
              <TextInput 
                placeholder="Cari Ruang..."
                value={roomSearch}
                onChangeText={setRoomSearch}
                style={styles.searchTextInput}
              />
            </View>
            <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
              <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled={true}>
                {roomList.filter(r => (r.ruangid || '').toLowerCase().includes(roomSearch.toLowerCase())).slice(0, 10).map((room) => (
                  <TouchableOpacity 
                    key={room.ruangid} 
                    style={[styles.pickerItem, formData.ruang_id === room.ruangid && { backgroundColor: theme.primary + '10' }]}
                    onPress={() => {
                      setFormData({ ...formData, ruang_id: room.ruangid });
                      setRoomSearch(room.ruangid);
                    }}
                  >
                    <ThemedText style={{ color: theme.text }}>{room.ruangid} - {room.ruangket}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>Waktu Pinjam</ThemedText>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                value={formData.waktu_pinjam}
                onChangeText={(val) => setFormData({...formData, waktu_pinjam: val})}
                placeholder="HH:mm"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>Waktu Kembali</ThemedText>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                value={formData.waktu_kembali}
                onChangeText={(val) => setFormData({...formData, waktu_kembali: val})}
                placeholder="HH:mm (Opsional)"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.submitBtnText}>Simpan Perubahan</ThemedText>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8 },
  searchTextInput: { flex: 1, marginLeft: 8, fontSize: 14, height: '100%' },
  pickerContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
