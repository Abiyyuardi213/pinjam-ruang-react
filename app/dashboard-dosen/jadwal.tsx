import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api';
import { storage } from '@/utils/storage';
import { useRouter } from 'expo-router';

const dayNames: Record<string, string> = {
  '1': 'Senin',
  '2': 'Selasa',
  '3': 'Rabu',
  '4': 'Kamis',
  '5': 'Jumat',
  '6': 'Sabtu',
  '7': 'Minggu',
};

export default function JadwalDosen() {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const savedUser = await storage.getItem('user_data');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserData(user);
        await fetchAllSchedules(user);
      }
    } catch (e) {
      console.error("Error loading initial data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllSchedules = async (user: any) => {
    try {
      const response = await apiService.getJadwal();
      if (Array.isArray(response.data)) {
        const lecturerId = String(user?.name || user?.id || '');
        
        // Filter by lecturer and sort by day then time
        const mySchedules = response.data
          .filter((item: any) => String(item.dosid || item.dosen_id) === lecturerId)
          .sort((a: any, b: any) => {
            if (a.hari !== b.hari) return Number(a.hari) - Number(b.hari);
            const timeA = a.jammulai || a.jam_mulai || '00:00';
            const timeB = b.jammulai || b.jam_mulai || '00:00';
            return timeA.localeCompare(timeB);
          });

        setSchedules(mySchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  // Group schedules by day
  const groupedSchedules = schedules.reduce((groups: any, schedule: any) => {
    const day = schedule.hari;
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(schedule);
    return groups;
  }, {});

  const daysWithSchedules = Object.keys(groupedSchedules).sort((a, b) => Number(a) - Number(b));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={styles.title}>Jadwal Mengajar</ThemedText>
            <ThemedText style={styles.subtitle}>Seluruh jadwal perkuliahan Anda</ThemedText>
          </View>
          <TouchableOpacity onPress={() => loadInitialData()} style={styles.refreshBtn}>
             <Ionicons name="sync-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <ThemedText style={styles.loadingText}>Memuat Jadwal...</ThemedText>
          </View>
        ) : daysWithSchedules.length > 0 ? (
          daysWithSchedules.map((day) => (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Ionicons name="calendar" size={16} color="#2563EB" />
                <ThemedText style={styles.dayTitle}>{dayNames[day] || `Hari ${day}`}</ThemedText>
              </View>
              
              <View style={styles.scheduleList}>
                {groupedSchedules[day].map((item: any, idx: number) => (
                  <ScheduleCard key={idx} item={item} />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
               <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            </View>
            <ThemedText style={styles.emptyText}>Tidak ada jadwal ditemukan</ThemedText>
            <ThemedText style={styles.emptySubText}>Seluruh jadwal mengajar Anda akan muncul di sini.</ThemedText>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function ScheduleCard({ item }: { item: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/dashboard-dosen/schedule-detail',
        params: { data: JSON.stringify(item) }
      })}
    >
      <View style={styles.cardTime}>
        <ThemedText style={styles.startTime}>{(item.jammulai || item.jam_mulai || '').substring(0, 5)}</ThemedText>
        <View style={styles.timeDivider} />
        <ThemedText style={styles.endTime}>{(item.jamhingga || item.jam_selesai || '').substring(0, 5)}</ThemedText>
      </View>
      
      <View style={styles.cardBody}>
        <ThemedText style={styles.subjectName} numberOfLines={1}>
          {item.mknama || item.subject_name}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <ThemedText style={styles.metaText}>{item.ruangid || item.ruang_id}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#64748B" />
            <ThemedText style={styles.metaText}>Kelas {item.kelas || '-'}</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#09090B',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    marginTop: 4,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardTime: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F1F4',
  },
  startTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  timeDivider: {
    width: 12,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
    borderRadius: 1,
  },
  endTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cardBody: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
});
