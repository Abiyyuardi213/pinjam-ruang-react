import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, useColorScheme, Platform, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

import { AdminHeader } from '@/components/ui/admin-header';

export default function DataRuanganScreen() {
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#64748B',
    border: '#E2E8F0',
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
      const response = await apiService.getRuang(500);
      if (response.success && Array.isArray(response.data)) {
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
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/dashboard-admin/room-detail', params: { id: item.ruangid } })}
        style={styles.modernRoomCard}
      >
        <View style={styles.cardMain}>
          <View style={[styles.roomIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="business" size={24} color={theme.primary} />
          </View>
          <View style={styles.roomContent}>
            <View style={styles.roomHeaderRow}>
               <ThemedText style={styles.roomCodeText}>{item.ruangid}</ThemedText>
               <View style={[styles.statusPill, { backgroundColor: '#DCFCE7' }]}>
                  <ThemedText style={[styles.statusPillText, { color: '#166534' }]}>AKTIF</ThemedText>
               </View>
            </View>
            <ThemedText style={styles.roomNameText} numberOfLines={1}>
              {item.ruangket || 'Deskripsi tidak tersedia'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardFeatures}>
           <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={14} color="#64748B" />
              <ThemedText style={styles.featureText}>{item.ruangkapasitas || 0} Orang</ThemedText>
           </View>
           <View style={styles.featureItem}>
              <Ionicons name="layers-outline" size={14} color="#64748B" />
              <ThemedText style={styles.featureText}>Lantai {item.ruangid.includes('-') ? item.ruangid.split('-')[1].charAt(0) : '1'}</ThemedText>
           </View>
           <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#64748B" />
              <ThemedText style={styles.featureText}>Lengkap</ThemedText>
           </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
        
        <AdminHeader 
          title="Daftar Ruangan"
          subtitle={`Mengelola ${rooms.length} aset ruangan aktif`}
          showBack={true}
          rightIcon="sync"
          onRightPress={fetchRooms}
        />

        {/* Modern Search Bar */}
        <View style={styles.searchSection}>
           <View style={styles.searchBarWrapper}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Cari kode atau nama ruangan..."
                placeholderTextColor="#94A3B8"
                style={styles.searchTextInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
           </View>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingTxt}>Sinkronisasi Data...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle" size={48} color={theme.danger} />
            <ThemedText style={styles.errorTxt}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchRooms}>
              <ThemedText style={styles.retryBtnTxt}>Coba Lagi</ThemedText>
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
              <View style={styles.emptyBox}>
                <Ionicons name="search" size={48} color="#E2E8F0" />
                <ThemedText style={styles.emptyTxt}>Ruangan tidak ditemukan</ThemedText>
              </View>
            }
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  modernRoomCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomContent: {
    flex: 1,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomCodeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  roomNameText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  cardFeatures: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTxt: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  errorTxt: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnTxt: {
    color: '#FFF',
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  }
});


