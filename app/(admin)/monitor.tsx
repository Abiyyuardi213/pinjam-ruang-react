import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, useColorScheme, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';

export default function AdminMonitor() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const isDark = colorScheme === 'dark';

  // Shadcn Theme Colors
  const theme = {
    bg: isDark ? '#09090B' : '#FAFAFA',
    text: isDark ? '#FAFAFA' : '#09090B',
    mutedText: isDark ? '#A1A1AA' : '#71717A',
    border: isDark ? '#27272A' : '#E4E4E7',
    primary: '#2563EB',
    cardBg: isDark ? '#18181A' : '#FFFFFF',
    danger: '#EF4444',
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ruangResp, jadwalResp] = await Promise.all([
          apiService.getRuang(),
          apiService.getJadwal()
      ]);

      const roomList = ruangResp.data?.data || (Array.isArray(ruangResp.data) ? ruangResp.data : []);
      if (Array.isArray(roomList)) {
        setRooms(roomList);
      }

      const jadwals = jadwalResp.data?.data || (Array.isArray(jadwalResp.data) ? jadwalResp.data : []);
      if (Array.isArray(jadwals)) {
          setSchedules(jadwals);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
          <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>Status real-time dari {rooms.length} ruangan yang tersinkronisasi dalam sistem saat ini.</ThemedText>

          <View style={styles.roomGrid}>
            {rooms.length > 0 ? (
                rooms.map((room, index) => {
                    const roomIdentifier = room.ruangid || room.nama_ruang || room.id;
                    const activeSchedule = schedules.find(s => s.ruang_id === roomIdentifier || s.room_name === roomIdentifier || s.ruang_id === room.ruangid);
                    const isInUse = !!activeSchedule;

                    return (
                        <View key={index} style={[styles.roomItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <View style={[styles.roomIconBox, { backgroundColor: isInUse ? (isDark ? '#EF444420' : '#FEF2F2') : (isDark ? '#2563EB20' : '#EFF6FF') }]}>
                                <Ionicons name={isInUse ? "close-circle" : "map-outline"} size={20} color={isInUse ? theme.danger : theme.primary} />
                            </View>
                            <View style={styles.roomInfo}>
                                <ThemedText style={[styles.roomId, { color: theme.text }]}>{room.nama_ruang || room.ruangket || room.ruangid}</ThemedText>
                                {isInUse ? (
                                    <ThemedText style={[styles.roomSub, { color: theme.danger }]}>Dosen: {activeSchedule.dosen_name || activeSchedule.dosen_id || 'Sedang Mengajar'}</ThemedText>
                                ) : (
                                    <ThemedText style={[styles.roomSub, { color: theme.mutedText }]}>Kapasitas: {room.kapasitas || room.ruangkapasitas || 0}</ThemedText>
                                )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: isInUse ? (isDark ? '#EF444420' : '#FEF2F2') : (isDark ? '#22C55E20' : '#DCFCE7') }]}>
                                <ThemedText style={[styles.statusText, { color: isInUse ? theme.danger : (isDark ? '#4ADE80' : '#166534') }]}>
                                    {isInUse ? 'In Use' : 'Available'}
                                </ThemedText>
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ThemedText style={{ color: theme.mutedText }}>Memuat data ruangan...</ThemedText>
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
});
