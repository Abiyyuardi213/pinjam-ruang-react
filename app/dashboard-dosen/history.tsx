import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api';
import { storage } from '@/utils/storage';

export default function HistoryDosen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [filterType, setFilterType] = useState<'today' | 'all'>('today');

  useEffect(() => {
    loadUserAndFetch();
  }, []);

  useEffect(() => {
    if (userData) fetchHistory(userData);
  }, [filterType]);

  const loadUserAndFetch = async () => {
    const saved = await storage.getItem('user_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserData(parsed);
      fetchHistory(parsed);
    } else {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (userData) fetchHistory(userData);
  }, [userData]);

  const fetchHistory = async (user: any) => {
    try {
      const [pinjamResp, jadwalResp] = await Promise.all([
        apiService.getPeminjaman(),
        apiService.getJadwal()
      ]);

      if (pinjamResp.success && Array.isArray(pinjamResp.data)) {
        const lecturerId = String(user?.name || user?.id || '');
        const schedules = Array.isArray(jadwalResp.data) ? jadwalResp.data : [];
        
        // Get today's date in YYYY-MM-DD
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Filter for this lecturer and date
        const filteredPinjam = pinjamResp.data.filter((b: any) => {
          const isMine = String(b.dosen_id) === lecturerId;
          if (filterType === 'today') {
            return isMine && (b.tanggal === todayStr || String(b.tanggal).includes(todayStr));
          }
          return isMine;
        });

        // Sort by date (newest first)
        filteredPinjam.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        // Enrich with schedule data
        const enriched = filteredPinjam.map((b: any) => {
          // Robust date parsing for different formats (YYYY-MM-DD or DD-MM-YYYY)
          let bDate: Date;
          if (String(b.tanggal).includes('-')) {
             const parts = String(b.tanggal).split('-');
             if (parts[0].length === 4) { // YYYY-MM-DD
                bDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
             } else { // DD-MM-YYYY
                bDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
             }
          } else {
             bDate = new Date(b.tanggal);
          }

          let bDay = bDate.getDay();
          if (bDay === 0) bDay = 7; // Sunday

          // Ensure time is in HH:mm:ss for comparison
          let bTime = b.waktu_pinjam || '00:00';
          if (bTime.split(':').length === 2) bTime += ':00';

          const match = schedules.find((s: any) => {
            const sDosId = String(s.dosid || s.dosen_id);
            const sRoom = String(s.ruangid || s.ruang_id).toUpperCase();
            const aRoom = String(b.ruang_id).toUpperCase();
            const start = s.jammulai || s.jam_mulai;
            const end = s.jamhingga || s.jam_hingga;

            // Match by Dosen, Day, Room, and Time Range
            return sDosId === lecturerId && 
                   sRoom === aRoom && 
                   String(s.hari) === String(bDay) &&
                   bTime >= (start.length === 5 ? start + ':00' : start) && 
                   bTime < (end.length === 5 ? end + ':00' : end);
          });

          // Fallback search if no exact match (same day and lecturer, but maybe different time/room)
          const fallbackMatch = !match ? schedules.find((s: any) => 
            String(s.dosid || s.dosen_id) === lecturerId && String(s.hari) === String(bDay)
          ) : null;

          return {
            ...b,
            mknama: match?.mknama || match?.subject_name || fallbackMatch?.mknama || (b.status === 'Kembali' ? 'Kegiatan Selesai' : 'Kegiatan Mandiri'),
            schStatus: match ? 'Sesuai Jadwal' : (fallbackMatch ? `Beda Ruang/Jam (${fallbackMatch.mknama})` : 'Luar Jadwal'),
            schColor: match ? '#166534' : (fallbackMatch ? '#B45309' : '#64748B'),
            isMatch: !!match
          };
        });

        setHistory(enriched);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={styles.title}>Riwayat Presensi</ThemedText>
            <ThemedText style={styles.subtitle}>Log peminjaman dan penggunaan kunci</ThemedText>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshIconBtn}>
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'today' && styles.filterChipActive]}
            onPress={() => setFilterType('today')}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={filterType === 'today' ? '#FFF' : '#64748B'} 
            />
            <ThemedText style={[styles.filterChipText, filterType === 'today' && styles.filterChipTextActive]}>
              Hari Ini
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={filterType === 'all' ? '#FFF' : '#64748B'} 
            />
            <ThemedText style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              Semua Riwayat
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#2563EB" size="large" />
          <ThemedText style={styles.loadingText}>Memuat Riwayat...</ThemedText>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
        >
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#CBD5E1" />
              <ThemedText style={styles.emptyText}>Belum ada riwayat peminjaman.</ThemedText>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={[styles.statusStrip, { backgroundColor: item.status === 'Dipinjam' ? '#3B82F6' : '#10B981' }]} />
                <View style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.courseName}>{item.mknama}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: item.status === 'Dipinjam' ? '#DBEAFE' : '#DCFCE7' }]}>
                      <ThemedText style={[styles.badgeText, { color: item.status === 'Dipinjam' ? '#1E40AF' : '#14532D' }]}>
                        {item.status}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Ionicons name="location-outline" size={14} color="#64748B" />
                      <ThemedText style={styles.infoText}>{item.ruang_id}</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <ThemedText style={styles.infoText}>{item.tanggal}</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <ThemedText style={styles.infoText}>
                        {item.waktu_pinjam} {item.waktu_kembali ? `- ${item.waktu_kembali}` : ''}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <View style={[styles.schBadge, { borderColor: item.schColor }]}>
                       <View style={[styles.dot, { backgroundColor: item.schColor }]} />
                       <ThemedText style={[styles.schText, { color: item.schColor }]}>{item.schStatus}</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  refreshIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 100,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  statusStrip: {
    width: 6,
  },
  cardMain: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoGrid: {
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    flexDirection: 'row',
  },
  schBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  schText: {
    fontSize: 10,
    fontWeight: '700',
  }
});
