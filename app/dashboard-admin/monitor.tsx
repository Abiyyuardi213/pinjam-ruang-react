import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, StatusBar, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';

export default function AdminMonitor() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
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
    danger: '#EF4444',
  };


  const [activeItems, setActiveItems] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[MONITOR] Fetching rooms, schedules, and borrowings...');
      const [ruangResp, jadwalResp, pinjamResp] = await Promise.all([
          apiService.getRuang(),
          apiService.getJadwal(),
          apiService.getPeminjaman()
      ]);

      const roomList = Array.isArray(ruangResp.data) ? ruangResp.data : [];
      const schedules = Array.isArray(jadwalResp.data) ? jadwalResp.data : [];
      const borrowings = Array.isArray(pinjamResp.data) ? pinjamResp.data : [];

      // Dapatkan Waktu Sekarang
      const now = new Date();
      let currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
      if (currentDay === 0) currentDay = 7; // Sesuaikan jika Minggu adalah 7
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}:00`;

      // Filter Ruangan yang Sedang Digunakan (Jadwal) atau Sedang Dipinjam
      const monitoringResults: any[] = [];

      roomList.forEach((room: any) => {
        const roomId = room.ruangid || room.nama_ruang || room.id;
        
        // 1. Cek Jadwal Kuliah (Hari ini & Jam ini)
        const currentSchedule = schedules.find((s: any) => {
            const sameRoom = (s.ruangid === roomId || s.ruang_id === roomId);
            const sameDay = String(s.hari) === String(currentDay);
            if (!sameRoom || !sameDay) return false;

            const start = s.jammulai || s.jam_mulai;
            const end = s.jamhingga || s.jam_hingga;
            return currentTime >= start && currentTime < end;
        });

        // 2. Cek Peminjaman Aktif (Sangat inklusif untuk memastikan sinkronisasi)
        const currentBorrowing = borrowings.find((b: any) => {
            const bRoomId = String(b.ruangid || b.ruang_id || b.ruang_nama || b.nama_ruang || b.ruangnama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetId = String(roomId).toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Pencocokan ID Ruangan (misal H1202 vs H-1202)
            const sameRoom = bRoomId === targetId || (bRoomId.length > 2 && targetId.includes(bRoomId)) || (targetId.length > 2 && bRoomId.includes(targetId));
            
            if (!sameRoom) return false;

            // Status: Kita anggap aktif kecuali jelas-jelas tertulis selesai/batal
            const status = String(b.status || b.peminjaman_status || '').toLowerCase();
            const inactiveStatuses = ['selesai', 'dibatalkan', 'ditolak', '0', 'false', 'expired'];
            const isActive = !inactiveStatuses.includes(status);
            
            return isActive;
        });

        // Hanya tampilkan jika ada Jadwal Kuliah (Ignore Peminjaman Luar Jadwal)
        if (currentSchedule) {
            monitoringResults.push({
                room,
                type: 'Jadwal Kuliah',
                dosen: currentSchedule.dosnama || 'Dosen ITATS',
                keterangan: currentSchedule.mknama,
                time: `${currentSchedule.jammulai.substring(0, 5)} - ${currentSchedule.jamhingga.substring(0, 5)}`,
                isBorrowed: !!currentBorrowing // Tetap pantau apakah kuncinya sudah diambil
            });
        }
      });

      setActiveItems(monitoringResults);
    } catch (err) {
      console.error('Error fetching monitor data:', err);
      setError('Gagal mengambil data monitoring terbaru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Pantau Ruangan</ThemedText>
            <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={22} color={theme.text} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>Daftar ruangan yang sedang digunakan untuk perkuliahan sesuai jadwal hari ini.</ThemedText>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.mutedText} />
                <TextInput 
                    placeholder="Cari ruang, dosen, atau mata kuliah..."
                    placeholderTextColor={theme.mutedText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: theme.text }]}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                    </TouchableOpacity>
                )}
            </View>
          </View>

          <View style={styles.roomGrid}>
            {isLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator color={theme.primary} />
                    <ThemedText style={{ color: theme.mutedText, marginTop: 12 }}>Menganalisis penggunaan ruangan...</ThemedText>
                </View>
            ) : error ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Ionicons name="alert-circle-outline" size={48} color={theme.danger} style={{ marginBottom: 16 }} />
                    <ThemedText style={{ color: theme.danger, textAlign: 'center', marginBottom: 16 }}>{error}</ThemedText>
                    <TouchableOpacity onPress={fetchData} style={[styles.refreshBtn, { backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }]}>
                        <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Coba Lagi</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (activeItems.filter(item => {
                const query = searchQuery.toLowerCase();
                const roomId = String(item.room.ruangid || item.room.nama_ruang || '').toLowerCase();
                const dosen = String(item.dosen || '').toLowerCase();
                const keterangan = String(item.keterangan || '').toLowerCase();
                return roomId.includes(query) || dosen.includes(query) || keterangan.includes(query);
              })).length > 0 ? (
                (activeItems.filter(item => {
                    const query = searchQuery.toLowerCase();
                    const roomId = String(item.room.ruangid || item.room.nama_ruang || '').toLowerCase();
                    const dosen = String(item.dosen || '').toLowerCase();
                    const keterangan = String(item.keterangan || '').toLowerCase();
                    return roomId.includes(query) || dosen.includes(query) || keterangan.includes(query);
                  })).map((item, index) => {
                    const { room, type, dosen, keterangan, time, isBorrowed } = item;
                    return (
                        <View key={index} style={[styles.roomItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <View style={[styles.roomIconBox, { backgroundColor: isBorrowed ? '#DCFCE7' : '#FEF2F2' }]}>
                                <Ionicons name={isBorrowed ? "key" : "time-outline"} size={20} color={isBorrowed ? '#166534' : theme.danger} />
                            </View>
                            <View style={styles.roomInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ThemedText style={[styles.roomId, { color: theme.text }]}>{room.ruangid || room.nama_ruang}</ThemedText>
                                    <View style={[styles.typeBadge, { backgroundColor: type === 'Jadwal Kuliah' ? '#DBEAFE' : '#FEF3C7' }]}>
                                        <ThemedText style={{ fontSize: 9, fontWeight: '700', color: type === 'Jadwal Kuliah' ? '#1E40AF' : '#92400E' }}>{type.toUpperCase()}</ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={[styles.roomSub, { color: theme.text, fontWeight: '600' }]}>{dosen}</ThemedText>
                                <ThemedText style={[styles.roomSub, { color: theme.mutedText }]} numberOfLines={1}>{keterangan}</ThemedText>
                            </View>
                            <View style={styles.timeBadge}>
                                <ThemedText style={[styles.timeText, { color: theme.danger, marginBottom: 4 }]}>{time}</ThemedText>
                                <View style={[styles.borrowBadge, { backgroundColor: isBorrowed ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <ThemedText style={[styles.borrowText, { color: isBorrowed ? '#166534' : '#991B1B' }]}>
                                        {isBorrowed ? 'Sudah Pinjam' : 'Belum Pinjam'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={{ padding: 60, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={theme.success || '#10B981'} />
                    <ThemedText style={{ color: theme.mutedText, textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '600' }}>Semua ruangan tersedia.</ThemedText>
                    <ThemedText style={{ color: theme.mutedText, textAlign: 'center', marginTop: 4, fontSize: 12 }}>Tidak ada kegiatan perkuliahan atau peminjaman aktif saat ini.</ThemedText>
                </View>
            )}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  refreshBtn: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: { padding: 24 },
  subtitle: { 
    fontSize: 14, 
    lineHeight: 20,
    marginBottom: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  roomGrid: { gap: 12 },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  roomIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomSub: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeBadge: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  borrowBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  borrowText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
