import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, StatusBar, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';

import { AdminHeader } from '@/components/ui/admin-header';

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
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        <AdminHeader 
          title="Monitor Gedung"
          subtitle="Pantauan Real-time Penggunaan Ruang ITATS"
          showBack={true}
          rightIcon="sync"
          onRightPress={fetchData}
        />


        <ScrollView 
          contentContainerStyle={styles.mainScrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Section - Natural Flow */}
          <View style={styles.summarySection}>
             <View style={[styles.sumCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                <Ionicons name="business" size={24} color="#2563EB" />
                <View>
                  <ThemedText style={[styles.sumVal, { color: '#1E40AF' }]}>{activeItems.length}</ThemedText>
                  <ThemedText style={[styles.sumLabel, { color: '#60A5FA' }]}>TERPAKAI</ThemedText>
                </View>
             </View>
             <View style={[styles.sumCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#166534" />
                <View>
                  <ThemedText style={[styles.sumVal, { color: '#14532D' }]}>{rooms.length - activeItems.length}</ThemedText>
                  <ThemedText style={[styles.sumLabel, { color: '#4ADE80' }]}>TERSEDIA</ThemedText>
                </View>
             </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <View style={styles.modernSearchBar}>
                <Ionicons name="search-outline" size={20} color="#94A3B8" />
                <TextInput 
                    placeholder="Cari ruangan atau dosen..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.modernSearchInput}
                />
            </View>
          </View>

          {/* Content List */}
          <View style={styles.roomListWrapper}>
            <View style={styles.listHeading}>
               <ThemedText style={styles.listTitle}>Status Penggunaan</ThemedText>
               <View style={styles.activePill}>
                  <ThemedText style={styles.activePillText}>{activeItems.length} Ruang Aktif</ThemedText>
               </View>
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator color={theme.primary} size="large" />
                    <ThemedText style={styles.statusText}>Memuat Data...</ThemedText>
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                    <ThemedText style={styles.errorMsg}>{error}</ThemedText>
                    <TouchableOpacity onPress={fetchData} style={styles.actionBtn}>
                        <ThemedText style={styles.actionBtnText}>Coba Lagi</ThemedText>
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
                        <View key={index} style={styles.modernRoomCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.roomBox}>
                                    <ThemedText style={styles.roomText}>{room.ruangid || room.nama_ruang}</ThemedText>
                                    <View style={styles.typeTag}>
                                      <ThemedText style={styles.typeTagText}>{type}</ThemedText>
                                    </View>
                                </View>
                                <View style={styles.timeTag}>
                                    <Ionicons name="time-outline" size={12} color="#EF4444" />
                                    <ThemedText style={styles.timeTagText}>{time}</ThemedText>
                                </View>
                            </View>
                            
                            <View style={styles.cardBody}>
                                <ThemedText style={styles.dosenTxt}>{dosen}</ThemedText>
                                <ThemedText style={styles.subjectTxt} numberOfLines={1}>{keterangan}</ThemedText>
                            </View>

                            <View style={[styles.cardFooter, { backgroundColor: isBorrowed ? '#F0FDF4' : '#FFF7ED' }]}>
                                <Ionicons 
                                  name={isBorrowed ? "checkmark-circle" : "alert-circle"} 
                                  size={16} 
                                  color={isBorrowed ? '#166534' : '#C2410C'} 
                                />
                                <ThemedText style={[styles.statusNote, { color: isBorrowed ? '#166534' : '#C2410C' }]}>
                                  {isBorrowed ? 'Kunci sudah dibawa dosen' : 'Dosen belum mengambil kunci'}
                                </ThemedText>
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCircle}>
                      <Ionicons name="checkmark-done" size={40} color="#22C55E" />
                    </View>
                    <ThemedText style={styles.emptyTitle}>Semua Ruangan Tersedia</ThemedText>
                    <ThemedText style={styles.emptySub}>Tidak ada aktivitas perkuliahan saat ini.</ThemedText>
                </View>
            )}
          </View>
          
          {/* Very Large Padding for Floating Navbar */}
          <View style={{ height: 180 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainScrollContent: {
    paddingTop: 24,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sumCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sumVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  sumLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modernSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  roomListWrapper: {
    paddingHorizontal: 24,
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  activePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  modernRoomCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dosenTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  subjectTxt: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusNote: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerBox: {
    padding: 60,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  errorMsg: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  }
});
