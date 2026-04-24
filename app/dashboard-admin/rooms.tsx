import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, useColorScheme, Platform, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function DataRuanganScreen() {
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Force Light Theme (Sesuai Permintaan User)
  const isDark = false;
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    success: '#10B981',
    danger: '#EF4444',
  };

  React.useEffect(() => {
    fetchRooms();
  }, []);

  // Handle Filtering (Search)
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room => 
        (room.ruangid && room.ruangid.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (room.ruangket && room.ruangket.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getRuang(500); // Minta 500 data
      if (response.success && Array.isArray(response.data)) {
        // Filter hanya ruangan yang statusnya aktif (true)
        const activeRooms = response.data.filter((r: any) => 
          r.ruangstatus === true || r.ruangstatus === 1 || String(r.ruangstatus) === "true"
        ).sort((a: any, b: any) => (a.ruangid || '').localeCompare(b.ruangid || ''));
        
        setRooms(activeRooms);
        setFilteredRooms(activeRooms);
      } else {
        setError(response.message || 'Gagal memuat data ruangan');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  const renderRoomItem = ({ item }: { item: any }) => {
    const isActive = item.ruangstatus === true || item.ruangstatus === 1 || String(item.ruangstatus) === "true";
    
    return (
      <View style={[styles.roomCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' }]}>
            <Ionicons name="business-outline" size={20} color={isActive ? theme.success : theme.mutedText} />
          </View>
          <View style={styles.roomInfo}>
            <ThemedText style={[styles.roomTitle, { color: theme.text }]}>{item.ruangid}</ThemedText>
            <ThemedText style={[styles.roomSubtitle, { color: theme.mutedText }]} numberOfLines={1}>
              {item.ruangket || 'Deskripsi tidak tersedia'}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
            <ThemedText style={[styles.statusText, { color: isActive ? '#166534' : '#991B1B' }]}>
              {isActive ? 'Aktif' : 'Non-Aktif'}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.capInfo}>
            <Ionicons name="people-outline" size={16} color={theme.mutedText} />
            <ThemedText style={[styles.capText, { color: theme.mutedText }]}>
              Kapasitas: {item.ruangkapasitas || 0} Orang
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.detailBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push({ pathname: '/dashboard-admin/room-detail', params: { id: item.ruangid } })}
          >
            <ThemedText style={styles.detailBtnText}>Detail</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard-admin')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Data Master Ruang</ThemedText>
            <ThemedText style={[styles.headerSub, { color: theme.mutedText }]}>Total {rooms.length} Ruangan Terdaftar</ThemedText>
          </View>
          <TouchableOpacity onPress={fetchRooms} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.mutedText} style={styles.searchIcon} />
            <TextInput
              placeholder="Cari kode atau nama ruangan..."
              placeholderTextColor={theme.mutedText}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.mutedText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: theme.mutedText }]}>Menyinkronkan Data...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
            <ThemedText style={[styles.errorText, { color: theme.danger }]}>{error}</ThemedText>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={fetchRooms}>
              <ThemedText style={styles.retryBtnText}>Coba Lagi</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={(item, index) => item.ruangid || index.toString()}
            renderItem={renderRoomItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.mutedText} />
                <ThemedText style={[styles.emptyText, { color: theme.mutedText }]}>Ruangan tidak ditemukan</ThemedText>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  roomCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  roomSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  detailBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
