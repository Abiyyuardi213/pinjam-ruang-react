import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function RoomDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = params.id as string;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [room, setRoom] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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
    let mounted = true;
    if (roomId) {
      fetchRoomDetail();
    } else {
      // Avoid infinite loading if roomId gets parsed slightly late or is missing
      const timer = setTimeout(() => {
        if (mounted) setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => { mounted = false; };
  }, [roomId]);

  const fetchRoomDetail = async () => {
    setLoading(true);
    try {
      // Find room from the general API
      const response = await apiService.getRuang();
      let rooms = [];
      if (response.data && Array.isArray(response.data.data)) {
        rooms = response.data.data;
      } else if (Array.isArray(response.data)) {
        rooms = response.data;
      }
      
      const found = rooms.find((r: any) => String(r.ruangid) === String(roomId));
      setRoom(found || null);
    } catch (error) {
      console.error('Error fetching room detail:', error);
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
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Detail Ruangan</ThemedText>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <ThemedText style={{ color: theme.mutedText }}>Memuat detail ruangan...</ThemedText>
            </View>
          ) : !room ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <ThemedText style={{ color: theme.mutedText }}>Data ruangan tidak ditemukan.</ThemedText>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                
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
                  
                  <View style={styles.infoGroup}>
                    <ThemedText style={styles.statLabel}>KETERANGAN</ThemedText>
                    <ThemedText style={[styles.infoText, { color: theme.text }]}>
                      {room.ruangket || 'Tidak ada keterangan kamar.'}
                    </ThemedText>
                  </View>

                </View>
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
    padding: 24,
    minHeight: 140,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  roomBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
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
    fontSize: 22,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 40,
    zIndex: 1,
  },
  cardBottom: {
    padding: 24,
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
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  }
});
