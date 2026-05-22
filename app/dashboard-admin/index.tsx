import { ThemedText } from "@/components/themed-text";
import { storage } from "@/utils/storage";
import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function AdminDashboard() {
   const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [stats, setStats] = React.useState({ ruang: 0, terpakai: 0 });
  const [recentJadwal, setRecentJadwal] = React.useState<any[]>([]);
  const [userData, setUserData] = React.useState<any>(null);

  // Refs to avoid stale closures in setInterval
  const lecturersRef = React.useRef<any[]>([]);
  const schedulesRef = React.useRef<any[]>([]);
  const activeRuangCountRef = React.useRef(0);

  // Gunakan useFocusEffect agar dashboard selalu sinkron dengan data terbaru secara real-time
  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        loadUserData();
        await loadCachedData();
        await fetchData(false);
        // Jalankan sinkronisasi data referensi di background tanpa menghalangi UI utama
        revalidateCache().catch(() => {});
      };
      load();

      const interval = setInterval(() => {
        fetchData(true);
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }, []),
  );

  // Force Light Theme untuk Dashboard Admin
  const isDark = false;

  // Shadcn Light Theme Colors
  const theme = {
    bg: "#FAFAFA",
    text: "#09090B",
    mutedText: "#71717A",
    border: "#E4E4E7",
    primary: "#2563EB", // Blue
    primaryForeground: "#FFFFFF",
    cardBg: "#FFFFFF",
  };

  const loadUserData = async () => {
    const saved = await storage.getItem("user_data");
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch (e) {}
    }
  };

  const loadCachedData = async () => {
    try {
      const cachedDosen = await storage.getItem("cached_dosen");
      const cachedJadwal = await storage.getItem("cached_jadwal");
      if (cachedDosen) {
        lecturersRef.current = JSON.parse(cachedDosen);
      }
      if (cachedJadwal) {
        schedulesRef.current = JSON.parse(cachedJadwal);
      }
    } catch (error) {
      console.warn("[CACHE] Gagal memuat cache lokal:", error);
    }
  };

  const revalidateCache = async () => {
    try {
      console.log("[CACHE] Memperbarui data referensi di background...");
      const [dosenData, jadwalData] = await Promise.all([
        apiService.getDosen(),
        apiService.getJadwal(),
      ]);

      if (dosenData.success && Array.isArray(dosenData.data) && dosenData.data.length > 0) {
        lecturersRef.current = dosenData.data;
        await storage.setItem("cached_dosen", JSON.stringify(dosenData.data));
      }
      if (jadwalData.success && Array.isArray(jadwalData.data) && jadwalData.data.length > 0) {
        schedulesRef.current = jadwalData.data;
        await storage.setItem("cached_jadwal", JSON.stringify(jadwalData.data));
      }
      console.log("[CACHE] Pembaruan data referensi di background selesai.");
    } catch (e) {
      console.warn("[CACHE] Gagal memperbarui cache di background:", e);
    }
  };

  const fetchData = async (isPolling = false) => {
    try {
      let dosenList = lecturersRef.current;
      let scheduleList = schedulesRef.current;
      let activeRuang = activeRuangCountRef.current;
      let peminjamanData;

      if (!isPolling) {
        // Jika data referensi masih kosong di memory, coba ambil dari storage
        if (dosenList.length === 0 || scheduleList.length === 0) {
          const cachedDosen = await storage.getItem("cached_dosen");
          const cachedJadwal = await storage.getItem("cached_jadwal");
          if (cachedDosen) {
            dosenList = JSON.parse(cachedDosen);
            lecturersRef.current = dosenList;
          }
          if (cachedJadwal) {
            scheduleList = JSON.parse(cachedJadwal);
            schedulesRef.current = scheduleList;
          }
        }

        // Siapkan Fetch Promises (jika sudah ada di memori/cache, abaikan pemanggilan API agar cepat)
        const dosenPromise = dosenList.length === 0 
          ? apiService.getDosen() 
          : Promise.resolve({ success: true, data: dosenList });
          
        const jadwalPromise = scheduleList.length === 0 
          ? apiService.getJadwal() 
          : Promise.resolve({ success: true, data: scheduleList });

        const [dosenData, ruangData, peminjamanDataRes, jadwalData] = await Promise.all([
          dosenPromise,
          apiService.getRuang(),
          apiService.getPeminjaman(),
          jadwalPromise,
        ]);

        if (dosenList.length === 0 && dosenData.success) {
          dosenList = Array.isArray(dosenData.data) ? dosenData.data : [];
          lecturersRef.current = dosenList;
          storage.setItem("cached_dosen", JSON.stringify(dosenList)).catch(() => {});
        }

        const allRuang = Array.isArray(ruangData.data) ? ruangData.data : [];
        if (allRuang.length > 0) {
          const filteredActiveRuang = allRuang.filter((r: any) => 
            r.ruangstatus === true || 
            r.ruangstatus === 'true' || 
            r.ruangstatus === 1 || 
            String(r.ruangstatus) === '1' || 
            String(r.ruangstatus) === 'true'
          );
          activeRuang = filteredActiveRuang.length;
          activeRuangCountRef.current = activeRuang;
        }

        if (scheduleList.length === 0 && jadwalData.success) {
          scheduleList = Array.isArray(jadwalData.data) ? jadwalData.data : [];
          schedulesRef.current = scheduleList;
          storage.setItem("cached_jadwal", JSON.stringify(scheduleList)).catch(() => {});
        }

        peminjamanData = peminjamanDataRes;
      } else {
        peminjamanData = await apiService.getPeminjaman();
      }

      if (peminjamanData && peminjamanData.success) {
        const borrowings = Array.isArray(peminjamanData.data) ? peminjamanData.data : [];
        const usedRoomsCount = borrowings.filter((b: any) => b.status === 'Dipinjam').length;

        setStats({
          terpakai: usedRoomsCount,
          ruang: activeRuang,
        });

        const rawList = borrowings;
        
        // Sort by the latest action time (waktu_kembali if returned, otherwise waktu_pinjam) descending
        const sorted = [...rawList].sort((a: any, b: any) => {
          const parseTime = (tanggal: string, waktu: string | null) => {
            if (!waktu || waktu === '-') return 0;
            const parsed = new Date(`${tanggal}T${waktu}:00`);
            return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
          };
          
          const timeA = parseTime(a.tanggal, a.waktu_kembali || a.waktu_pinjam);
          const timeB = parseTime(b.tanggal, b.waktu_kembali || b.waktu_pinjam);
          return timeB - timeA;
        });

        // Enrich activities with schedule matching
        const enriched = sorted.slice(0, 6).map((item: any) => {
            const itemDate = new Date(item.tanggal);
            let itemDay = itemDate.getDay();
            if (itemDay === 0) itemDay = 7;
            const itemTime = (item.waktu_pinjam || '00:00') + ':00';
            
            const match = scheduleList.find((s: any) => {
                const sDosId = String(s.dosid || s.dosen_id);
                const sHari = String(s.hari);
                const start = s.jammulai || s.jam_mulai;
                const end = s.jamhingga || s.jam_hingga;
                
                return sDosId === String(item.dosen_id) && 
                       sHari === String(itemDay) && 
                       itemTime >= start && itemTime < end;
            });
            
            let schStatus = 'Luar Jadwal';
            let schColor = '#64748B';
            
            if (match) {
                const sRoom = String(match.ruangid || match.ruang_id).toUpperCase();
                const aRoom = String(item.ruang_id).toUpperCase();
                if (sRoom === aRoom) {
                    schStatus = 'Sesuai Jadwal';
                    schColor = '#166534';
                } else {
                    schStatus = `Beda Ruang (${sRoom})`;
                    schColor = '#EF4444';
                }
            }
            
            // Resolve returning lecturer's name
            let pengembali_name = null;
            if (item.dosid_pengembalian) {
              const matchedDosen = dosenList.find((d: any) => 
                String(d.dosid).trim().toLowerCase() === String(item.dosid_pengembalian).trim().toLowerCase()
              );
              if (matchedDosen) {
                pengembali_name = matchedDosen.dosnama;
              }
            }
            
            return { ...item, schStatus, schColor, pengembali_name };
        });
        
        setRecentJadwal(enriched);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleLogout = () => {
    const performLogout = async () => {
      await storage.removeItem('user_data');
      await storage.removeItem('auth_token');
      
      Toast.show({
        type: 'success',
        text1: 'Logout Berhasil',
        text2: 'Sesi Anda telah berakhir dengan aman.',
        visibilityTime: 3000,
      });

      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Konfirmasi Keluar',
        'Apakah Anda yakin ingin keluar?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', onPress: performLogout, style: 'destructive' }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header Area */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View />
            <TouchableOpacity
              onPress={() => router.push("/dashboard-admin/profile")}
              style={styles.profileBtn}
            >
              <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarText}>
                  {(userData?.fullname || userData?.name || "A").substring(0, 1).toUpperCase()}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
            <View style={styles.headerContent}>
              <ThemedText style={styles.greetingText}>
                Selamat Datang,
              </ThemedText>
              <ThemedText style={styles.adminName}>
                {userData?.fullname || userData?.name || "Administrator"}
              </ThemedText>
              <ThemedText style={styles.subGreeting}>
                Kelola ketersediaan ruang perkuliahan ITATS hari ini.
              </ThemedText>
            </View>
          </View>

          {/* Stats Section - Bento Style */}
          <View style={styles.statsWrapper}>
            <View style={[styles.statBox, { backgroundColor: "#3B82F6" }]}>
              <View style={styles.statIconCircle}>
                <Ionicons name="business" size={20} color="#3B82F6" />
              </View>
              <ThemedText style={styles.statBoxValue}>{stats.ruang}</ThemedText>
              <ThemedText style={styles.statBoxLabel}>Total Ruangan</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#8B5CF6" }]}>
              <View style={styles.statIconCircle}>
                <Ionicons name="key" size={20} color="#8B5CF6" />
              </View>
              <ThemedText style={styles.statBoxValue}>{stats.terpakai}</ThemedText>
              <ThemedText style={styles.statBoxLabel}>Ruangan Digunakan</ThemedText>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionSection}>
            <ThemedText style={styles.sectionTitle}>Akses Cepat</ThemedText>
            <View style={styles.actionGrid}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/scan")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="qr-code" size={22} color="#2563EB" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Scan QR</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/rooms")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="layers" size={22} color="#166534" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Data Ruang</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/peminjaman")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#F5F3FF" }]}>
                    <Ionicons name="calendar" size={22} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Peminjaman</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/monitor")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#FFF7ED" }]}>
                    <Ionicons name="eye" size={22} color="#C2410C" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Monitoring</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={[styles.actionRow, { marginTop: 12 }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/mapping")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#ECFDF5" }]}>
                    <Ionicons name="map" size={22} color="#059669" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Mapping</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/subjects")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="book" size={22} color="#DC2626" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Mata Kuliah</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={() => router.push("/dashboard-admin/profile")}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#F1F5F9" }]}>
                    <Ionicons name="person" size={22} color="#475569" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Profil</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionItem}
                  onPress={handleLogout}
                >
                  <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="log-out" size={22} color="#EF4444" />
                  </View>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>Keluar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Aktivitas Terbaru
              </ThemedText>
              <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                <Ionicons name="reload" size={16} color={theme.primary} />
                <ThemedText
                  style={{
                    color: theme.primary,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Segarkan
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              {recentJadwal.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="file-tray-outline"
                    size={48}
                    color="#E4E4E7"
                  />
                  <ThemedText style={styles.emptyText}>
                    Belum ada aktivitas hari ini.
                  </ThemedText>
                </View>
              ) : (
                recentJadwal.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.6}
                    style={styles.activityItem}
                  >
                    <View
                      style={[
                        styles.activityIcon,
                        {
                          backgroundColor:
                            item.status === "Dipinjam" ? "#EFF6FF" : "#F0FDF4",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          item.status === "Dipinjam"
                            ? "time"
                            : "checkmark-circle"
                        }
                        size={20}
                        color={
                          item.status === "Dipinjam" ? theme.primary : "#166534"
                        }
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <ThemedText style={styles.activityName} numberOfLines={1}>
                        {item.dosen_name}
                      </ThemedText>
                      {item.status === "Kembali" && item.pengembali_name && (
                        <ThemedText style={{ fontSize: 11, color: '#166534', fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                          Kembali oleh: {item.pengembali_name}
                        </ThemedText>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <ThemedText style={styles.activitySub}>
                          {item.ruang_id} • {item.waktu_pinjam}{item.status === 'Kembali' && item.waktu_kembali ? ` - ${item.waktu_kembali}` : ''}
                        </ThemedText>
                        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
                        <ThemedText style={{ fontSize: 10, fontWeight: '800', color: item.schColor || '#64748B' }}>
                          {item.schStatus}
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        {
                          backgroundColor:
                            item.status === "Dipinjam" ? "#DBEAFE" : "#DCFCE7",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusTagText,
                          {
                            color:
                              item.status === "Dipinjam"
                                ? theme.primary
                                : "#166534",
                          },
                        ]}
                      >
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
    backgroundColor: "#1E293B",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
  },
  headerContent: {
    marginTop: 8,
  },
  greetingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  adminName: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  subGreeting: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    lineHeight: 18,
  },
  statsWrapper: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 24,
    marginTop: -25,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statBoxValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },
  statBoxLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  actionSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090B",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionGrid: {
    flexDirection: "column",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1F1F4",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F1F4",
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 12,
    color: "#64748B",
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  emptyText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
});
