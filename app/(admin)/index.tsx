import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { apiService } from '@/services/api';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [stats, setStats] = React.useState({ ruang: 0, dosen: 0 });
  const [recentJadwal, setRecentJadwal] = React.useState<any[]>([]);
  const isDark = colorScheme === 'dark';

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dosenData, ruangData, jadwalData] = await Promise.all([
        apiService.getDosen(),
        apiService.getRuang(),
        apiService.getJadwal(),
      ]);

      setStats({
        dosen: dosenData.data?.length || 0,
        ruang: ruangData.data?.length || 0,
      });

      if (jadwalData.data) {
        setRecentJadwal(jadwalData.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.welcomeText}>Pinjam Ruang Dashboard</ThemedText>
              <ThemedText type="title" style={styles.title}>Admin Control</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                style={styles.menuHandle} 
                onPress={() => setSidebarVisible(true)}
              >
                <Ionicons name="menu-outline" size={32} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar}>
                <ThemedText style={styles.avatarText}>AD</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <CardHeader style={styles.tightHeader}>
                <Ionicons name="business-outline" size={20} color="#1A4FA0" />
                <CardTitle style={styles.statValue}>{stats.ruang}</CardTitle>
                <CardDescription>Total Ruangan</CardDescription>
              </CardHeader>
            </Card>
            <Card style={styles.statCard}>
              <CardHeader style={styles.tightHeader}>
                <Ionicons name="people-outline" size={20} color="#1A4FA0" />
                <CardTitle style={styles.statValue}>{stats.dosen}</CardTitle>
                <CardDescription>Dosen Aktif</CardDescription>
              </CardHeader>
            </Card>
          </View>

          {/* Main Action Card */}
          <Card style={styles.mainCard}>
            <CardHeader>
              <CardTitle>Cek Presensi Ruang</CardTitle>
              <CardDescription>Pindai kode QR dosen untuk memvalidasi penggunaan ruangan secara real-time.</CardDescription>
            </CardHeader>
            <CardContent>
              <TouchableOpacity style={styles.scanButton}>
                <Ionicons name="qr-code-outline" size={24} color="#000" />
                <ThemedText style={styles.scanButtonText}>Buka Kamera Scanner</ThemedText>
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* Activity Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Log Jadwal Perkuliahan</ThemedText>
              <TouchableOpacity onPress={fetchData}>
                <Ionicons name="refresh" size={18} color="#1A4FA0" />
              </TouchableOpacity>
            </View>

            <View style={styles.logList}>
              {recentJadwal.map((item, index) => (
                <ActivityLog 
                  key={index}
                  name={item.dosen_name || 'Dosen'} 
                  room={item.ruang_id || item.room_name || 'Ruang'} 
                  time={item.jam_mulai || '00:00'} 
                  status="Active" 
                  isDark={isDark}
                />
              ))}
              {recentJadwal.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedText style={{ opacity: 0.5, fontSize: 13 }}>
                        Sedang memuat data jadwal...
                    </ThemedText>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ActivityLog({ name, room, time, status, isDark }: any) {
  return (
    <View style={[styles.logItem, { borderBottomColor: isDark ? '#2E2E2E' : '#F1F5F9' }]}>
      <View style={styles.logIcon}>
        <Ionicons 
          name={status === 'Success' ? 'checkmark-circle' : 'time-outline'} 
          size={20} 
          color={status === 'Success' ? '#1A4FA0' : '#94A3B8'} 
        />
      </View>
      <View style={styles.logInfo}>
        <ThemedText style={styles.logName}>{name}</ThemedText>
        <ThemedText style={styles.logSubText}>{room} • {time}</ThemedText>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: status === 'Success' ? '#1A4FA020' : '#94A3B820' }]}>
        <ThemedText style={[styles.statusText, { color: status === 'Success' ? '#1A4FA0' : '#94A3B8' }]}>
          {status}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  menuHandle: {
    padding: 8,
    marginLeft: -8,
  },
  welcomeText: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A4FA0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  tightHeader: {
    padding: 16,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    marginTop: 8,
  },
  mainCard: {
    marginBottom: 32,
    borderColor: '#3ECF8E30',
  },
  scanButton: {
    backgroundColor: '#1A4FA0',
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#1A4FA0',
    fontSize: 14,
    fontWeight: '600',
  },
  logList: {
    gap: 0,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logIcon: {
    marginRight: 16,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 15,
    fontWeight: '600',
  },
  logSubText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
