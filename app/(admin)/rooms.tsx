import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function DataRuanganScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isDark = colorScheme === 'dark';

  // Shadcn Theme Colors
  const theme = {
    bg: isDark ? '#09090B' : '#FAFAFA',
    text: isDark ? '#FAFAFA' : '#09090B',
    mutedText: isDark ? '#A1A1AA' : '#71717A',
    border: isDark ? '#27272A' : '#E4E4E7',
    primary: '#2563EB',
    cardBg: isDark ? '#18181A' : '#FFFFFF',
  };

  React.useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRuang();
      if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else if (Array.isArray(response.data)) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
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
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Data Seluruh Ruang</ThemedText>
            <TouchableOpacity style={styles.searchBtn}>
                <Ionicons name="search" size={22} color={theme.text} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>Manajemen database ruangan dengan total {(rooms || []).length} entri di kampus.</ThemedText>

          {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                  <ThemedText style={{ color: theme.mutedText }}>Memuat data ruangan...</ThemedText>
              </View>
          ) : (
            <View style={styles.cardsContainer}>
              {(rooms || []).map((room, index) => (
                  <View key={index} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <View style={styles.cardTop}>
                        <View style={styles.roomBadge}>
                          <ThemedText style={styles.roomBadgeText}>{room.ruangid}</ThemedText>
                        </View>
                        
                        <Ionicons name="business-outline" size={100} color="rgba(255,255,255,0.03)" style={styles.bgIcon} />
                        
                        <ThemedText style={styles.roomTitle}>{room.ruangket || room.ruangid}</ThemedText>
                      </View>

                      <View style={styles.cardBottom}>
                        <View style={styles.statsRow}>
                          <View style={styles.statCol}>
                            <ThemedText style={styles.statLabel}>STATUS AKTIF</ThemedText>
                            <View style={styles.statusBox}>
                              <View style={[styles.statusDot, { backgroundColor: room.ruangstatus ? '#10B981' : '#EF4444' }]} />
                              <ThemedText style={[styles.statValue, { color: theme.text }]}>
                                {room.ruangstatus ? 'AKTIF' : 'NON-AKTIF'}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
                            <ThemedText style={styles.statLabel}>KAPASITAS</ThemedText>
                            <ThemedText style={[styles.statValue, { color: theme.text }]}>{room.ruangkapasitas || 0} ORANG</ThemedText>
                          </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        
                        <TouchableOpacity 
                          style={[styles.detailButton, { backgroundColor: isDark ? '#27272A' : '#18181A' }]}
                          onPress={() => router.push({ pathname: '/(admin)/room-detail', params: { id: room.ruangid } })}
                        >
                          <ThemedText style={styles.detailButtonText}>LIHAT DETAIL</ThemedText>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                      </View>
                  </View>
              ))}

              {!loading && (rooms || []).length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                      <ThemedText style={{ color: theme.mutedText }}>Data tidak ditemukan.</ThemedText>
                  </View>
              )}
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
  searchBtn: {
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
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTop: {
    backgroundColor: '#1E1E1E', // Dark top area
    padding: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  roomBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 0,
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 32,
    zIndex: 1,
  },
  cardBottom: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
