import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, useColorScheme, Platform, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { apiService } from '@/services/api';

export default function SubjectsScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    accent: '#8B5CF6',
    success: '#10B981',
  };

  React.useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle Filtering (Search)
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubjects(subjects);
    } else {
      const filtered = subjects.filter(sub => 
        (sub.mknama && sub.mknama.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sub.mkid && sub.mkid.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredSubjects(filtered);
    }
  }, [searchQuery, subjects]);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getJadwal();
      if (response.success && Array.isArray(response.data)) {
        // Ambil mata kuliah unik dari jadwal
        const uniqueMap = new Map();
        response.data.forEach((item: any) => {
          if (item.mkid && !uniqueMap.has(item.mkid)) {
            uniqueMap.set(item.mkid, {
              mkid: item.mkid,
              mknama: item.mknama || 'Mata Kuliah Tanpa Nama',
              sks: item.sks || 0,
              pakid: item.pakid,
              jurid: item.jurid
            });
          }
        });
        
        const list = Array.from(uniqueMap.values()).sort((a, b) => a.mknama.localeCompare(b.mknama));
        setSubjects(list);
        setFilteredSubjects(list);
      } else {
        setError('Gagal memuat data mata kuliah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  const renderSubjectItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="book-outline" size={20} color={theme.accent} />
          </View>
          <View style={styles.info}>
            <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={2}>{item.mknama}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>
              ID: {item.mkid}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              {item.sks} SKS
            </ThemedText>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Ionicons name="layers-outline" size={16} color={theme.mutedText} />
            <ThemedText style={[styles.footerText, { color: theme.mutedText }]}>
              PAK {item.pakid} • Jurusan {item.jurid}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push({ pathname: '/dashboard-admin/subject-detail', params: { mkid: item.mkid } })}
          >
            <ThemedText style={styles.actionBtnText}>Detail</ThemedText>
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
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard-admin')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Mata Kuliah</ThemedText>
            <ThemedText style={[styles.headerSub, { color: theme.mutedText }]}>Total {subjects.length} Mata Kuliah</ThemedText>
          </View>
          <TouchableOpacity onPress={fetchSubjects} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.mutedText} style={styles.searchIcon} />
            <TextInput
              placeholder="Cari nama atau kode mata kuliah..."
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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: theme.mutedText }]}>Memproses Data...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <ThemedText style={[styles.errorText, { color: theme.text }]}>{error}</ThemedText>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={fetchSubjects}>
              <ThemedText style={styles.retryBtnText}>Coba Lagi</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.mkid}
            renderItem={renderSubjectItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.mutedText} />
                <ThemedText style={[styles.emptyText, { color: theme.mutedText }]}>Mata kuliah tidak ditemukan</ThemedText>
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
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
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
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
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
