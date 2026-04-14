import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, useColorScheme, Platform, StatusBar, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

// Generate color based on some string hash
const getColorForId = (id: string, isDark: boolean) => {
    const colorsLight = ['#DCFCE7', '#DBEAFE', '#FEF9C3', '#FEE2E2', '#F3E8FF', '#FFEDD5'];
    const colorsDark = ['#166534', '#1E3A8A', '#854D0E', '#991B1B', '#581C87', '#9A3412'];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorsLight.length;
    return isDark ? colorsDark[index] : colorsLight[index];
};

const getTextColorForId = (id: string, isDark: boolean) => {
    const colorsLight = ['#166534', '#1E3A8A', '#854D0E', '#991B1B', '#581C87', '#9A3412'];
    const colorsDark = ['#DCFCE7', '#DBEAFE', '#FEF9C3', '#FEE2E2', '#F3E8FF', '#FFEDD5'];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorsLight.length;
    return isDark ? colorsDark[index] : colorsLight[index];
}

const TIME_SLOTS = [
  { label: '1 (08.00)', time: '08:00' },
  { label: '2 (08.50)', time: '08:50' },
  { label: '3 (10.00)', time: '10:00' },
  { label: '4 (10.50)', time: '10:50' },
  { label: '5 (12.30)', time: '12:30' },
  { label: '6 (13.20)', time: '13:20' },
  { label: '7 (14.20)', time: '14:20' },
  { label: '8 (15.10)', time: '15:10' },
  { label: '9 (17.00)', time: '17:00' },
  { label: '10 (18.00)', time: '18:00' },
  { label: '11 (18.50)', time: '18:50' },
  { label: '12 (19.50)', time: '19:50' },
  { label: '13 (20.40)', time: '20:40' },
];

export default function MappingRuangScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [selectedPak, setSelectedPak] = React.useState<string>('all');
  const [selectedHari, setSelectedHari] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const isDark = colorScheme === 'dark';

  const theme = {
    bg: isDark ? '#09090B' : '#FAFAFA',
    text: isDark ? '#FAFAFA' : '#09090B',
    mutedText: isDark ? '#A1A1AA' : '#71717A',
    border: isDark ? '#27272A' : '#E4E4E7',
    primary: '#2563EB',
    cardBg: isDark ? '#18181A' : '#FFFFFF',
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
      console.error('Error fetching mapping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniquePaks = Array.from(new Set(schedules.map(s => s.pakid).filter(Boolean)));
  const uniqueDays = Array.from(new Set(schedules.map(s => s.haridesc || s.hari).filter(Boolean)));

  const filteredSchedules = schedules.filter(s => {
      if (selectedPak !== 'all' && s.pakid !== selectedPak) return false;
      if (selectedHari !== 'all' && (s.haridesc !== selectedHari && s.hari !== selectedHari)) return false;
      return true;
  });

  const getScheduleForSlot = (roomIdentifier: string, slotTime: string) => {
      const roomSchedules = filteredSchedules.filter(s => s.ruang_id === roomIdentifier || s.ruangid === roomIdentifier || s.room_name === roomIdentifier);
      return roomSchedules.find(s => {
          if (!s.jammulai && !s.jam_mulai) return false;
          const start = s.jammulai || s.jam_mulai;
          return start.startsWith(slotTime);
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Mapping Ruang</ThemedText>
            <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={22} color={theme.text} />
            </TouchableOpacity>
        </View>

        {/* Filter Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPak('all')} style={[styles.pillBtn, selectedPak === 'all' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}>
                    <ThemedText style={{ color: selectedPak === 'all' ? '#FFF' : theme.text, fontSize: 12, fontWeight: '600' }}>Semua PAK</ThemedText>
                </TouchableOpacity>
                {uniquePaks.map((pak: any, idx) => (
                    <TouchableOpacity key={idx} onPress={() => setSelectedPak(pak)} style={[styles.pillBtn, selectedPak === pak ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}>
                        <ThemedText style={{ color: selectedPak === pak ? '#FFF' : theme.text, fontSize: 12, fontWeight: '600' }}>PAK {pak}</ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setSelectedHari('all')} style={[styles.pillBtn, selectedHari === 'all' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}>
                    <ThemedText style={{ color: selectedHari === 'all' ? '#FFF' : theme.text, fontSize: 12, fontWeight: '600' }}>Semua Hari</ThemedText>
                </TouchableOpacity>
                {uniqueDays.map((hari: any, idx) => (
                    <TouchableOpacity key={idx} onPress={() => setSelectedHari(hari)} style={[styles.pillBtn, selectedHari === hari ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}>
                        <ThemedText style={{ color: selectedHari === hari ? '#FFF' : theme.text, fontSize: 12, fontWeight: '600' }}>{hari}</ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <View style={styles.tableWrapper}>
            {loading ? (
                 <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                     <ThemedText style={{ color: theme.mutedText }}>Menyusun data jadwal ruangan...</ThemedText>
                 </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={{ flex: 1 }}>
                        {/* Table Header - Kept outside FlatList so it stays at the top vertically */}
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                            <View style={[styles.cellRoomHeader, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                <ThemedText style={[styles.colHeaderText, { color: theme.mutedText }]}>Ruang</ThemedText>
                            </View>
                            {TIME_SLOTS.map((slot, index) => (
                                <View key={index} style={[styles.cellHeader, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                    <ThemedText style={[styles.colHeaderText, { color: theme.text }]}>{slot.label}</ThemedText>
                                </View>
                            ))}
                        </View>

                        {/* Table Rows per room using FlatList to prevent UI freeze (Virtualization) */}
                        <FlatList
                            data={rooms}
                            keyExtractor={(item, index) => (item.ruangid || item.nama_ruang || index).toString()}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            removeClippedSubviews={true}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item: room }) => {
                                const roomIdentifier = room.ruangid || room.nama_ruang || room.id;

                                return (
                                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <View style={[styles.cellRoomHeader, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
                                            <ThemedText style={[styles.roomCode, { color: theme.text }]}>{roomIdentifier}</ThemedText>
                                            <ThemedText style={[styles.roomCap, { color: theme.mutedText }]}>Kapasitas: {room.kapasitas || room.ruangkapasitas || 0}</ThemedText>
                                        </View>
                                        
                                        {TIME_SLOTS.map((slot, colIndex) => {
                                            const schedule = getScheduleForSlot(roomIdentifier, slot.time);

                                            if (schedule) {
                                                const schId = String(schedule.mkid || schedule.matkul_id || schedule.mknama || '1');
                                                const bgColor = getColorForId(schId, isDark);
                                                const textColor = getTextColorForId(schId, isDark);
                                                
                                                // Handle various api structures
                                                const namaMk = schedule.mknama || schedule.matkul_nama || schedule.matkul || 'Mata Kuliah';
                                                const dosenNm = schedule.dosnama || schedule.dosen_name || schedule.dosen_id || 'Belum diatur';
                                                
                                                return (
                                                    <View key={colIndex} style={[styles.cellData, { borderColor: theme.border }]}>
                                                        <View style={[styles.scheduleBlock, { backgroundColor: bgColor }]}>
                                                            <ThemedText style={[styles.mkText, { color: textColor }]} numberOfLines={2}>
                                                                {namaMk} ({schedule.kelas || '-'})
                                                            </ThemedText>
                                                            <ThemedText style={[styles.dosenText, { color: textColor }]} numberOfLines={2}>
                                                                {dosenNm}
                                                            </ThemedText>
                                                        </View>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <View key={colIndex} style={[styles.cellDataEmpty, { borderColor: theme.border, backgroundColor: theme.cardBg }]} />
                                            );
                                        })}
                                    </View>
                                );
                            }}
                            ListFooterComponent={<View style={{ height: 100 }} />}
                        />
                    </View>
                </ScrollView>
            )}
        </View>
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
  pillBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
  },
  tableWrapper: {
      flex: 1,
      borderTopWidth: 1,
      borderColor: '#E4E4E7',
  },
  cellRoomHeader: {
      width: 100,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRightWidth: 1,
  },
  colHeaderText: {
      fontSize: 12,
      fontWeight: '600',
  },
  cellHeader: {
      width: 140,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      borderRightWidth: 1,
  },
  roomCode: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
  },
  roomCap: {
      fontSize: 11,
  },
  cellData: {
      width: 140,
      padding: 4,
      borderRightWidth: 1,
  },
  cellDataEmpty: {
      width: 140,
      borderRightWidth: 1,
  },
  scheduleBlock: {
      flex: 1,
      borderRadius: 6,
      padding: 8,
      justifyContent: 'center',
  },
  mkText: {
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 2,
  },
  dosenText: {
      fontSize: 10,
      fontWeight: '500',
  }
});
