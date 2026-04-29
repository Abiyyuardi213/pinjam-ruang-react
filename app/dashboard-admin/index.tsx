import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, useColorScheme, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { useRouter, useFocusEffect } from 'expo-router';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [stats, setStats] = React.useState({ ruang: 0, dosen: 0 });
  const [recentJadwal, setRecentJadwal] = React.useState<any[]>([]);
  const [userData, setUserData] = React.useState<any>(null);
  
  // Gunakan useFocusEffect agar dashboard selalu sinkron dengan data terbaru
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      loadUserData();
    }, [])
  );

  // Force Light Theme untuk Dashboard Admin
  const isDark = false; 

  // Shadcn Light Theme Colors
  const theme = {
    bg: '#FAFAFA', 
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB', // Blue
    primaryForeground: '#FFFFFF',
    cardBg: '#FFFFFF',
  };


  React.useEffect(() => {
    fetchData();
    loadUserData();
  }, []);

  const loadUserData = () => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('user_data');
      if (saved) {
        try {
          setUserData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  };

  const fetchData = async () => {
    try {
      const [dosenData, ruangData, peminjamanData] = await Promise.all([
        apiService.getDosen(),
        apiService.getRuang(),
        apiService.getPeminjaman(),
      ]);

      setStats({
        dosen: dosenData.data?.total || (Array.isArray(dosenData.data) ? dosenData.data.length : 0),
        ruang: ruangData.data?.total || (Array.isArray(ruangData.data) ? ruangData.data.length : 0),
      });

      if (peminjamanData.success) {
        setRecentJadwal(peminjamanData.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Modern Header Area */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.iconBtn}>
                <Ionicons name="grid-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/dashboard-admin/profile')} style={styles.profileBtn}>
                <View style={styles.avatarContainer}>
                  <ThemedText style={styles.avatarText}>
                    {(userData?.name || 'A').substring(0, 1).toUpperCase()}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <ThemedText style={styles.greetingText}>Selamat Datang,</ThemedText>
              <ThemedText style={styles.adminName}>{userData?.name || 'Administrator'}</ThemedText>
              <ThemedText style={styles.subGreeting}>Kelola ketersediaan ruang perkuliahan ITATS hari ini.</ThemedText>
            </View>
          </View>

          {/* Stats Section - Bento Style */}
          <View style={styles.statsWrapper}>
            <View style={[styles.statBox, { backgroundColor: '#3B82F6' }]}>
               <View style={styles.statIconCircle}>
                  <Ionicons name="business" size={20} color="#3B82F6" />
               </View>
               <ThemedText style={styles.statBoxValue}>{stats.ruang}</ThemedText>
               <ThemedText style={styles.statBoxLabel}>Total Ruangan</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#8B5CF6' }]}>
               <View style={styles.statIconCircle}>
                  <Ionicons name="people" size={20} color="#8B5CF6" />
               </View>
               <ThemedText style={styles.statBoxValue}>{stats.dosen}</ThemedText>
               <ThemedText style={styles.statBoxLabel}>Total Dosen</ThemedText>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionSection}>
            <ThemedText style={styles.sectionTitle}>Akses Cepat</ThemedText>
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.actionItem, { backgroundColor: '#FFF' }]} 
                onPress={() => router.push('/dashboard-admin/scan')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="qr-code" size={24} color="#2563EB" />
                </View>
                <ThemedText style={styles.actionLabel}>Scan QR</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.actionItem, { backgroundColor: '#FFF' }]} 
                onPress={() => router.push('/dashboard-admin/rooms')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="layers" size={24} color="#166534" />
                </View>
                <ThemedText style={styles.actionLabel}>Data Ruang</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.actionItem, { backgroundColor: '#FFF' }]} 
                onPress={() => router.push('/dashboard-admin/monitor')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="eye" size={24} color="#C2410C" />
                </View>
                <ThemedText style={styles.actionLabel}>Monitoring</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Aktivitas Terbaru</ThemedText>
              <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                <Ionicons name="reload" size={16} color={theme.primary} />
                <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>Segarkan</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              {recentJadwal.length === 0 ? (
                 <View style={styles.emptyState}>
                     <Ionicons name="file-tray-outline" size={48} color="#E4E4E7" />
                     <ThemedText style={styles.emptyText}>Belum ada aktivitas hari ini.</ThemedText>
                 </View>
              ) : (
                recentJadwal.map((item, index) => (
                  <TouchableOpacity key={index} activeOpacity={0.6} style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: item.status === 'Dipinjam' ? '#EFF6FF' : '#F0FDF4' }]}>
                        <Ionicons 
                          name={item.status === 'Dipinjam' ? "time" : "checkmark-circle"} 
                          size={20} 
                          color={item.status === 'Dipinjam' ? theme.primary : '#166534'} 
                        />
                    </View>
                    <View style={styles.activityContent}>
                        <ThemedText style={styles.activityName} numberOfLines={1}>{item.dosen_name}</ThemedText>
                        <ThemedText style={styles.activitySub}>{item.ruang_id} • {item.waktu_pinjam}</ThemedText>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: item.status === 'Dipinjam' ? '#DBEAFE' : '#DCFCE7' }]}>
                        <ThemedText style={[styles.statusTagText, { color: item.status === 'Dipinjam' ? theme.primary : '#166534' }]}>
                          {item.status}
                        </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 18,
  },
  headerContent: {
    marginTop: 8,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  adminName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  subGreeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  statsWrapper: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    marginTop: -25,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBoxValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statBoxLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#09090B',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 12,
    color: '#64748B',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  }
});
