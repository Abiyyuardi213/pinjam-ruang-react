import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, useColorScheme, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [stats, setStats] = React.useState({ ruang: 0, dosen: 0 });
  const [recentJadwal, setRecentJadwal] = React.useState<any[]>([]);
  const isDark = colorScheme === 'dark';

  // Shadcn Theme Colors
  const theme = {
    bg: isDark ? '#09090B' : '#FAFAFA', // Very light gray/white for light mode
    text: isDark ? '#FAFAFA' : '#09090B',
    mutedText: isDark ? '#A1A1AA' : '#71717A',
    border: isDark ? '#27272A' : '#E4E4E7',
    primary: '#2563EB', // Blue
    primaryForeground: '#FFFFFF', // White text on blue button
    cardBg: isDark ? '#18181A' : '#FFFFFF',
  };

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
        dosen: dosenData.data?.total || (Array.isArray(dosenData.data) ? dosenData.data.length : 0),
        ruang: ruangData.data?.total || (Array.isArray(ruangData.data) ? ruangData.data.length : 0),
      });

      const schedules = jadwalData.data?.data || (Array.isArray(jadwalData.data) ? jadwalData.data : []);
      if (Array.isArray(schedules)) {
        setRecentJadwal(schedules.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={[styles.welcomeText, { color: theme.mutedText }]}>Dashboard Pintar</ThemedText>
              <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Admin Panel</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                style={styles.menuHandle} 
                onPress={() => setSidebarVisible(true)}
              >
                <Ionicons name="menu" size={28} color={theme.text} />
              </TouchableOpacity>
              <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <CardHeader style={styles.tightHeader}>
                <Ionicons name="business-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.statValue, { color: theme.text }]}>{stats.ruang}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.mutedText }]}>Total Ruangan</ThemedText>
              </CardHeader>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <CardHeader style={styles.tightHeader}>
                <Ionicons name="people-outline" size={20} color={theme.primary} />
                <ThemedText style={[styles.statValue, { color: theme.text }]}>{stats.dosen}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.mutedText }]}>Dosen Aktif</ThemedText>
              </CardHeader>
            </Card>
          </View>

          {/* Primary Action Button (Blue with White Text) */}
          <View style={[styles.mainCard, { borderColor: theme.border }]}>
             <View style={styles.mainCardText}>
                <ThemedText style={[styles.mainCardTitle, { color: theme.text }]}>Cek Presensi Ruang</ThemedText>
                <ThemedText style={[styles.mainCardDesc, { color: theme.mutedText }]}>Pindai kode QR dosen untuk memvalidasi penggunaan ruangan secara real-time.</ThemedText>
             </View>
             <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/scan')}>
                <Ionicons name="qr-code-outline" size={20} color={theme.primaryForeground} />
                <ThemedText style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>Scan Validasi</ThemedText>
             </TouchableOpacity>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.border }]} onPress={() => router.push('/rooms')}>
                <Ionicons name="folder-outline" size={18} color={theme.text} />
                <ThemedText style={[styles.outlineBtnText, { color: theme.text }]}>Data Master</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.border }]} onPress={() => router.push('/monitor')}>
                <Ionicons name="grid-outline" size={18} color={theme.text} />
                <ThemedText style={[styles.outlineBtnText, { color: theme.text }]}>Pantau Ruang</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Activity Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Log Jadwal Terakhir</ThemedText>
              <TouchableOpacity onPress={fetchData}>
                <Ionicons name="refresh" size={18} color={theme.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.logList, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              {recentJadwal.length === 0 ? (
                 <View style={{ padding: 32, alignItems: 'center' }}>
                     <ThemedText style={{ color: theme.mutedText, fontSize: 13 }}>Memuat data jadwal...</ThemedText>
                 </View>
              ) : (
                recentJadwal.map((item, index) => (
                  <View key={index} style={[styles.logItem, index !== recentJadwal.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                    <View style={[styles.logIcon, { backgroundColor: isDark ? '#2563EB20' : '#EFF6FF' }]}>
                        <Ionicons name="timer-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.logInfo}>
                        <ThemedText style={[styles.logName, { color: theme.text }]}>{item.dosen_name || 'Dosen Pengajar'}</ThemedText>
                        <ThemedText style={[styles.logRoom, { color: theme.mutedText }]}>{item.ruang_id || item.room_name || 'Ruang'} • {item.jam_mulai || '00:00'}</ThemedText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? '#22C55E20' : '#DCFCE7' }]}>
                        <ThemedText style={[styles.statusText, { color: isDark ? '#4ADE80' : '#166534' }]}>Active</ThemedText>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Nav Padding */}
          <View style={{ height: 100 }} />

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
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  menuHandle: {
    padding: 8,
    marginLeft: -8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: 'transparent',
  },
  tightHeader: {
    padding: 16,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  mainCardText: {
    marginBottom: 16,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  mainCardDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  logList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  logRoom: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
