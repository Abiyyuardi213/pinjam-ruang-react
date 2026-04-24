import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function SubjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mkid = params.mkid as string;
  
  const [subject, setSubject] = React.useState<any>(null);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    accent: '#8B5CF6',
  };

  React.useEffect(() => {
    if (mkid) {
      fetchDetail();
    }
  }, [mkid]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await apiService.getJadwal();
      if (response.success && Array.isArray(response.data)) {
        // Cari info mata kuliah
        const relatedSchedules = response.data.filter((s: any) => String(s.mkid) === String(mkid));
        if (relatedSchedules.length > 0) {
            const first = relatedSchedules[0];
            setSubject({
                mkid: first.mkid,
                mknama: first.mknama,
                sks: first.sks,
                pakid: first.pakid,
                jurid: first.jurid
            });
            setSchedules(relatedSchedules);
        }
      }
    } catch (error) {
      console.error('Error fetching subject detail:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/dashboard-admin/subjects')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Detail Mata Kuliah</ThemedText>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.centerContainer}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText style={{ color: theme.mutedText, marginTop: 12 }}>Memuat data...</ThemedText>
            </View>
          ) : !subject ? (
            <View style={styles.centerContainer}>
                <ThemedText style={{ color: theme.mutedText }}>Data tidak ditemukan.</ThemedText>
            </View>
          ) : (
            <View>
                {/* Info Card */}
                <View style={[styles.mainCard, { backgroundColor: '#1E1E1E' }]}>
                    <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>{subject.mkid}</ThemedText>
                    </View>
                    <ThemedText style={styles.mkTitle}>{subject.mknama}</ThemedText>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.6)" />
                            <ThemedText style={styles.metaText}>{subject.sks} SKS</ThemedText>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.6)" />
                            <ThemedText style={styles.metaText}>Jurusan {subject.jurid}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Daftar Kelas & Jadwal</ThemedText>
                    <View style={styles.countBadge}>
                        <ThemedText style={styles.countText}>{schedules.length} Kelas</ThemedText>
                    </View>
                </View>

                {/* Schedule List */}
                {schedules.map((item, index) => (
                    <View key={index} style={[styles.scheduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                        <View style={styles.cardIndicator} />
                        <View style={styles.scheduleInfo}>
                            <View style={styles.row}>
                                <ThemedText style={[styles.kelasName, { color: theme.text }]}>Kelas {item.kelas}</ThemedText>
                                <ThemedText style={[styles.hariText, { color: theme.primary }]}>{item.haridesc}</ThemedText>
                            </View>
                            <ThemedText style={[styles.dosenName, { color: theme.mutedText }]}>{item.dosnama}</ThemedText>
                            
                            <View style={styles.timeRow}>
                                <View style={styles.timeItem}>
                                    <Ionicons name="time-outline" size={14} color={theme.mutedText} />
                                    <ThemedText style={[styles.timeLabel, { color: theme.mutedText }]}>
                                        {item.jammulai.substring(0, 5)} - {item.jamhingga.substring(0, 5)}
                                    </ThemedText>
                                </View>
                                <View style={styles.timeItem}>
                                    <Ionicons name="location-outline" size={14} color={theme.mutedText} />
                                    <ThemedText style={[styles.timeLabel, { color: theme.mutedText }]}>{item.ruangket || item.ruangid}</ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
          )}

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: { padding: 24 },
  centerContainer: {
    padding: 60,
    alignItems: 'center',
  },
  mainCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mkTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  scheduleCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardIndicator: {
    width: 6,
    backgroundColor: '#2563EB',
  },
  scheduleInfo: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kelasName: {
    fontSize: 15,
    fontWeight: '700',
  },
  hariText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dosenName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
  }
});
