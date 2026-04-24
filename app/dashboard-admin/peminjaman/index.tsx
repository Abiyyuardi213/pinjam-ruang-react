import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, Platform, StatusBar, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';
import Toast from 'react-native-toast-message';

export default function PeminjamanRuangScreen() {
  const router = useRouter();
  
  // Ambil tanggal hari ini dalam format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  const [borrowings, setBorrowings] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  // Gunakan useFocusEffect agar data selalu refresh saat kembali ke halaman ini
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [selectedDate]) // Refresh jika tanggal berubah
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPeminjaman(selectedDate);
      if (response.success) {
        setBorrowings(response.data);
      }
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleReturn = async (id: string) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];
    const fullTime = `${dateStr} ${currentTime}`;
    
    // Update local state untuk UI instan
    setBorrowings(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'Kembali', waktu_kembali: fullTime } : item
    ));
    
    // Update di API/Persistence
    await apiService.updateStatus(id, 'Kembali', fullTime);
    
    Toast.show({
      type: 'success',
      text1: 'Ruangan Dikembalikan',
      text2: 'Status peminjaman telah diperbarui.'
    });
  };

  const filteredBorrowings = borrowings.filter(item => 
    (item.dosen_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.ruang_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.ruang_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Prioritaskan 'Dipinjam' di atas 'Kembali'
    if (a.status === 'Dipinjam' && b.status === 'Kembali') return -1;
    if (a.status === 'Kembali' && b.status === 'Dipinjam') return 1;
    
    // Jika status sama, urutkan berdasarkan yang terbaru (ID atau created_at jika ada)
    return b.id > a.id ? 1 : -1;
  });

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.numberBadge, { backgroundColor: theme.primary + '10' }]}>
          <ThemedText style={[styles.numberText, { color: theme.primary }]}>{index + 1}</ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={[styles.dosenName, { color: theme.text }]}>{item.dosen_name}</ThemedText>
          <ThemedText style={[styles.dosenId, { color: theme.mutedText }]}>NIP: {item.dosen_id}</ThemedText>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'Dipinjam' ? '#EFF6FF' : '#DCFCE7' 
        }]}>
          <ThemedText style={[styles.statusText, { 
            color: item.status === 'Dipinjam' ? theme.primary : '#166534' 
          }]}>
            {item.status}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="business-outline" size={14} color={theme.mutedText} />
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>{item.ruang_id} - {item.ruang_name}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={theme.mutedText} />
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>{item.tanggal}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={theme.mutedText} />
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>Pinjam: {item.waktu_pinjam}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.mutedText} />
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>Kembali: {item.waktu_kembali || '-'}</ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: theme.border }]}
          onPress={() => router.push({
            pathname: '/dashboard-admin/peminjaman/edit',
            params: { id: item.id, data: JSON.stringify(item) }
          })}
        >
          <Ionicons name="create-outline" size={16} color={theme.text} />
          <ThemedText style={[styles.actionText, { color: theme.text }]}>Update</ThemedText>
        </TouchableOpacity>
        {item.status === 'Dipinjam' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => handleReturn(item.id)}
          >
            <Ionicons name="return-down-back" size={16} color="#FFF" />
            <ThemedText style={[styles.actionText, { color: '#FFF' }]}>Kembali</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.title, { color: theme.text }]}>Peminjaman Ruang</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>Monitoring penggunaan ruangan</ThemedText>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/dashboard-admin/peminjaman/create')}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Section */}
        <View style={styles.filterRow}>
          {/* Search Bar */}
          <View style={[styles.searchBar, { flex: 1, backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.mutedText} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cari..."
              placeholderTextColor={theme.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Date Picker */}
          <View style={[styles.dateFilter, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="calendar" size={18} color={theme.primary} />
            <TextInput
              style={[styles.dateInput, { color: theme.text }]}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              // @ts-ignore - type date is for web
              type="date"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={{ marginTop: 12, color: theme.mutedText }}>Memuat data...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredBorrowings}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={theme.border} />
                <ThemedText style={{ color: theme.mutedText, marginTop: 16 }}>Belum ada data peminjaman</ThemedText>
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
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    width: 150,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
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
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  dosenName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dosenId: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
  }
});
