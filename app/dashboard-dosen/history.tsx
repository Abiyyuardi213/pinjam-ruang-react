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

          // Find all schedules for this lecturer on this day
          const daySchedules = schedules.filter((s: any) => {
            const sDosId = String(s.dosid || s.dosen_id);
            return sDosId === lecturerId && String(s.hari) === String(bDay);
          });

          let roomStatus = { isCorrect: false, text: 'Luar Jadwal', detail: 'Tidak ada jadwal hari ini', color: '#64748B' };
          let timeStatus = { isCorrect: false, text: 'Luar Jadwal', detail: 'Tidak ada jadwal hari ini', color: '#64748B' };
          let matchedSubject = b.status === 'Kembali' ? 'Kegiatan Selesai' : 'Kegiatan Mandiri';

          if (match) {
            roomStatus = { isCorrect: true, text: 'Sesuai', detail: `Ruang ${b.ruang_id}`, color: '#166534' };
            timeStatus = { isCorrect: true, text: 'Sesuai', detail: `Jam ${(match.jammulai || match.jam_mulai).substring(0, 5)} - ${(match.jamhingga || match.jam_hingga).substring(0, 5)}`, color: '#166534' };
            matchedSubject = match.mknama || match.subject_name || matchedSubject;
          } else if (daySchedules.length > 0) {
            // Find schedule that matches the time
            const timeMatchedSchedule = daySchedules.find((s: any) => {
              const start = s.jammulai || s.jam_mulai;
              const end = s.jamhingga || s.jam_hingga;
              const formattedStart = start.length === 5 ? start + ':00' : start;
              const formattedEnd = end.length === 5 ? end + ':00' : end;
              return bTime >= formattedStart && bTime < formattedEnd;
            });

            if (timeMatchedSchedule) {
              matchedSubject = timeMatchedSchedule.mknama || timeMatchedSchedule.subject_name || matchedSubject;
              timeStatus = { 
                isCorrect: true, 
                text: 'Sesuai', 
                detail: `Jam ${(timeMatchedSchedule.jammulai || timeMatchedSchedule.jam_mulai).substring(0, 5)} - ${(timeMatchedSchedule.jamhingga || timeMatchedSchedule.jam_hingga).substring(0, 5)}`, 
                color: '#166534' 
              };
              const schedRoom = timeMatchedSchedule.ruangid || timeMatchedSchedule.ruang_id;
              roomStatus = { 
                isCorrect: false, 
                text: 'Beda Ruangan', 
                detail: `Jadwal di ${schedRoom} (Aktual: ${b.ruang_id})`, 
                color: '#B45309' 
              };
            } else {
              // Find schedule that matches the room
              const roomMatchedSchedule = daySchedules.find((s: any) => 
                String(s.ruangid || s.ruang_id).toUpperCase() === String(b.ruang_id).toUpperCase()
              );

              if (roomMatchedSchedule) {
                matchedSubject = roomMatchedSchedule.mknama || roomMatchedSchedule.subject_name || matchedSubject;
                roomStatus = { 
                  isCorrect: true, 
                  text: 'Sesuai', 
                  detail: `Ruang ${b.ruang_id}`, 
                  color: '#166534' 
                };
                const schedStart = (roomMatchedSchedule.jammulai || roomMatchedSchedule.jam_mulai).substring(0, 5);
                const schedEnd = (roomMatchedSchedule.jamhingga || roomMatchedSchedule.jam_hingga).substring(0, 5);
                timeStatus = { 
                  isCorrect: false, 
                  text: 'Beda Jam', 
                  detail: `Jadwal: ${schedStart} - ${schedEnd} (Aktual: ${(b.waktu_pinjam || '').substring(0, 5)})`, 
                  color: '#B45309' 
                };
              } else {
                // Find closest schedule by time
                const timeToMinutes = (timeStr: string) => {
                  const [h, m] = timeStr.split(':').map(Number);
                  return (h || 0) * 60 + (m || 0);
                };
                const bMin = timeToMinutes(b.waktu_pinjam || '00:00');
                let closestSchedule = daySchedules[0];
                let minDiff = Infinity;
                daySchedules.forEach((s: any) => {
                  const startStr = s.jammulai || s.jam_mulai || '00:00';
                  const startMin = timeToMinutes(startStr);
                  const diff = Math.abs(bMin - startMin);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestSchedule = s;
                  }
                });

                matchedSubject = closestSchedule.mknama || closestSchedule.subject_name || matchedSubject;
                const schedRoom = closestSchedule.ruangid || closestSchedule.ruang_id;
                const schedStart = (closestSchedule.jammulai || closestSchedule.jam_mulai).substring(0, 5);
                const schedEnd = (closestSchedule.jamhingga || closestSchedule.jam_hingga).substring(0, 5);
                
                roomStatus = { 
                  isCorrect: false, 
                  text: 'Beda Ruangan', 
                  detail: `Jadwal di ${schedRoom} (Aktual: ${b.ruang_id})`, 
                  color: '#B45309' 
                };
                timeStatus = { 
                  isCorrect: false, 
                  text: 'Beda Jam', 
                  detail: `Jadwal: ${schedStart} - ${schedEnd} (Aktual: ${(b.waktu_pinjam || '').substring(0, 5)})`, 
                  color: '#B45309' 
                };
              }
            }
          }

          return {
            ...b,
            mknama: matchedSubject,
            schStatus: match ? 'Sesuai Jadwal' : (daySchedules.length > 0 ? 'Beda Ruang/Jam' : 'Luar Jadwal'),
            schColor: match ? '#166534' : (daySchedules.length > 0 ? '#B45309' : '#64748B'),
            isMatch: !!match,
            roomStatus,
            timeStatus
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

                  {/* Status Kesesuaian Ruangan & Jam */}
                  <View style={styles.statusSection}>
                    <View style={styles.statusRow}>
                      <Ionicons 
                        name={item.roomStatus?.isCorrect ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={item.roomStatus?.color || '#64748B'} 
                      />
                      <View style={styles.statusDetails}>
                        <ThemedText style={styles.statusLabel}>
                          Ruangan: <ThemedText style={[styles.statusValue, { color: item.roomStatus?.color }]}>{item.roomStatus?.text}</ThemedText>
                        </ThemedText>
                        {item.roomStatus?.detail ? (
                          <ThemedText style={styles.statusDesc}>{item.roomStatus.detail}</ThemedText>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Ionicons 
                        name={item.timeStatus?.isCorrect ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={item.timeStatus?.color || '#64748B'} 
                      />
                      <View style={styles.statusDetails}>
                        <ThemedText style={styles.statusLabel}>
                          Jam/Waktu: <ThemedText style={[styles.statusValue, { color: item.timeStatus?.color }]}>{item.timeStatus?.text}</ThemedText>
                        </ThemedText>
                        {item.timeStatus?.detail ? (
                          <ThemedText style={styles.statusDesc}>{item.timeStatus.detail}</ThemedText>
                        ) : null}
                      </View>
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
          <View style={{ height: 120 }} />
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
  },
  statusSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  statusDetails: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusValue: {
    fontWeight: '800',
  },
  statusDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  }
});
