import { ThemedText } from "@/components/themed-text";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { AdminHeader } from "@/components/ui/admin-header";

export default function AdminMonitor() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  // Force Light Theme
  const isDark = false;

  // Shadcn Light Theme Colors
  const theme = {
    bg: "#FAFAFA",
    text: "#09090B",
    mutedText: "#71717A",
    border: "#E4E4E7",
    primary: "#2563EB",
    cardBg: "#FFFFFF",
    danger: "#EF4444",
  };

  const [activeItems, setActiveItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      console.log(`[MONITOR] Fetching data for ${today}...`);

      const [ruangResp, jadwalResp, pinjamResp] = await Promise.all([
        apiService.getRuang(),
        apiService.getJadwal(),
        apiService.getPeminjaman(), // Hapus filter today agar sinkron dengan dashboard jika dashboard tidak pakai filter tanggal
      ]);

      const roomList = Array.isArray(ruangResp.data) ? ruangResp.data : [];
      const schedules = Array.isArray(jadwalResp.data) ? jadwalResp.data : [];
      const borrowings = Array.isArray(pinjamResp.data) ? pinjamResp.data : [];

      // Dapatkan Waktu Sekarang
      const now = new Date();
      let currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
      if (currentDay === 0) currentDay = 7; // Sesuaikan ITATS (1=Senin, ..., 7=Minggu)

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}:00`;

      // Filter ruangan aktif seperti di dashboard
      const activeRooms = roomList.filter((r: any) => 
        r.ruangstatus === true || 
        r.ruangstatus === 'true' || 
        r.ruangstatus === 1 || 
        String(r.ruangstatus) === '1' || 
        String(r.ruangstatus) === 'true'
      );

      const monitoringResults: any[] = [];
      const handledRoomIds = new Set<string>();

      // 1. Tampilkan semua Jadwal yang Seharusnya Berlangsung Saat Ini
      activeRooms.forEach((room: any) => {
        const roomId = String(room.ruangid || room.nama_ruang || "").toUpperCase();
        
        // Cari jadwal untuk ruangan ini
        const currentSchedule = schedules.find((s: any) => {
          const sRoomId = String(s.ruangid || s.ruang_id || "").toUpperCase();
          const sameRoom = sRoomId === roomId;
          const sameDay = String(s.hari) === String(currentDay);
          if (!sameRoom || !sameDay) return false;

          const start = s.jammulai || s.jam_mulai;
          const end = s.jamhingga || s.jam_hingga;
          return currentTime >= start && currentTime < end;
        });

        if (currentSchedule) {
          const scheduledDosId = String(currentSchedule.dosid || currentSchedule.dosen_id);
          
          // 1. Cek apakah ada yang sedang meminjam ruangan ini (berdasarkan status 'Dipinjam')
          const roomBorrowing = borrowings.find((b: any) => 
            String(b.ruang_id).toUpperCase() === roomId && b.status === "Dipinjam"
          );

          let borrowInfo = {
            status: "Kunci belum diambil",
            type: "warning",
            actualRoom: null
          };

          if (roomBorrowing) {
            const borrowerId = String(roomBorrowing.dosen_id);
            if (borrowerId === scheduledDosId) {
              borrowInfo = {
                status: "Kunci sudah diambil",
                type: "success",
                actualRoom: roomId
              };
            } else {
              borrowInfo = {
                status: `Kunci diambil oleh Dosen Lain: ${roomBorrowing.dosen_name}`,
                type: "danger",
                actualRoom: roomId
              };
            }
          } else {
            // Cek apakah ada record peminjaman yang sudah SELESAI (Kembali) hari ini untuk ruangan & dosen ini
            // Ini menandakan dosen sudah selesai mengajar sebelum jadwal berakhir
            const returnedBorrowing = borrowings.find((b: any) => 
              String(b.ruang_id).toUpperCase() === roomId && 
              String(b.dosen_id) === scheduledDosId && 
              b.status === "Kembali" &&
              (b.tanggal === today || String(b.tanggal).startsWith(today))
            );

            if (returnedBorrowing) {
              borrowInfo = {
                status: "Kunci kembali mendahului jadwal selesai",
                type: "warning",
                actualRoom: roomId
              };
            } else {
              // Jika kunci ruangan ini BELUM diambil, cek apakah dosen yang dijadwalkan malah meminjam ruangan lain
              const lecturerBorrowingSomewhere = borrowings.find((b: any) => 
                String(b.dosen_id) === scheduledDosId && b.status === "Dipinjam"
              );

              if (lecturerBorrowingSomewhere) {
                const borrowedRoomId = String(lecturerBorrowingSomewhere.ruang_id).toUpperCase();
                borrowInfo = {
                  status: `Dosen mengambil kunci ruangan berbeda: ${borrowedRoomId}`,
                  type: "danger",
                  actualRoom: borrowedRoomId
                };
              }
            }
          }

          monitoringResults.push({
            room,
            type: "Jadwal Kuliah",
            dosen: currentSchedule.dosnama || "Dosen ITATS",
            keterangan: currentSchedule.mknama,
            time: `${(currentSchedule.jammulai || "").substring(0, 5)} - ${(currentSchedule.jamhingga || "").substring(0, 5)}`,
            borrowInfo
          });
          
          handledRoomIds.add(roomId);
        }
      });

      // 2. Tambahkan Ruangan yang SEDANG DIPINJAM tapi TIDAK ADA JADWAL (Peminjaman Mandiri)
      borrowings.forEach((borrow: any) => {
        if (borrow.status === 'Dipinjam') {
          const roomId = String(borrow.ruang_id).toUpperCase();
          
          // Jika ruangan ini sudah masuk di hasil (karena ada jadwal), abaikan
          if (handledRoomIds.has(roomId)) return;

          const roomObj = activeRooms.find(r => 
            String(r.ruangid || r.nama_ruang || "").toUpperCase() === roomId
          );

          monitoringResults.push({
            room: roomObj || { ruangid: borrow.ruang_id },
            type: "Peminjaman Luar Jadwal",
            dosen: borrow.dosen_name,
            keterangan: "Kegiatan Mandiri / Pengganti",
            time: `${borrow.waktu_pinjam} - Selesai`,
            borrowInfo: {
              status: "Kunci sudah diambil",
              type: "success",
              actualRoom: roomId
            }
          });
          
          handledRoomIds.add(roomId);
        }
      });

      setActiveItems(monitoringResults);
      setRooms(activeRooms); 
    } catch (err) {
      console.error("Error fetching monitor data:", err);
      setError("Gagal mengambil data monitoring terbaru.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <AdminSidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <AdminHeader
        title="Monitor Gedung"
        subtitle="Real-time Penggunaan Ruang ITATS"
        showBack={false}
        showMenu={true}
        onMenuPress={() => setSidebarVisible(true)}
        rightIcon="sync"
        onRightPress={fetchData}
      />

      <ScrollView
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Section - Natural Flow */}
        <View style={styles.summarySection}>
          <View
            style={[
              styles.sumCard,
              { backgroundColor: "#EFF6FF", borderColor: "#DBEAFE" },
            ]}
          >
            <Ionicons name="key" size={24} color="#2563EB" />
            <View>
              <ThemedText style={[styles.sumVal, { color: "#1E40AF" }]}>
                {activeItems.filter(i => i.borrowInfo.status === "Kunci sudah diambil").length}
              </ThemedText>
              <ThemedText style={[styles.sumLabel, { color: "#60A5FA" }]}>
                DIGUNAKAN
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.sumCard,
              { backgroundColor: "#F0FDF4", borderColor: "#DCFCE7" },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color="#166534" />
            <View>
              <ThemedText style={[styles.sumVal, { color: "#14532D" }]}>
                {rooms.length - activeItems.filter(i => i.borrowInfo.status === "Kunci sudah diambil").length}
              </ThemedText>
              <ThemedText style={[styles.sumLabel, { color: "#4ADE80" }]}>
                TERSEDIA
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.modernSearchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Cari ruangan atau dosen..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.modernSearchInput}
            />
          </View>
        </View>

        {/* Content List */}
        <View style={styles.roomListWrapper}>
          <View style={styles.listHeading}>
            <ThemedText style={styles.listTitle}>Status Penggunaan</ThemedText>
            <View style={styles.activePill}>
              <ThemedText style={styles.activePillText}>
                {activeItems.length} Ruang Aktif
              </ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={theme.primary} size="large" />
              <ThemedText style={styles.statusText}>Memuat Data...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <ThemedText style={styles.errorMsg}>{error}</ThemedText>
              <TouchableOpacity onPress={fetchData} style={styles.actionBtn}>
                <ThemedText style={styles.actionBtnText}>Coba Lagi</ThemedText>
              </TouchableOpacity>
            </View>
          ) : activeItems.filter((item) => {
              const query = searchQuery.toLowerCase();
              const roomId = String(
                item.room.ruangid || item.room.nama_ruang || "",
              ).toLowerCase();
              const dosen = String(item.dosen || "").toLowerCase();
              const keterangan = String(item.keterangan || "").toLowerCase();
              return (
                roomId.includes(query) ||
                dosen.includes(query) ||
                keterangan.includes(query)
              );
            }).length > 0 ? (
            activeItems
              .filter((item) => {
                const query = searchQuery.toLowerCase();
                const roomId = String(
                  item.room.ruangid || item.room.nama_ruang || "",
                ).toLowerCase();
                const dosen = String(item.dosen || "").toLowerCase();
                const keterangan = String(item.keterangan || "").toLowerCase();
                return (
                  roomId.includes(query) ||
                  dosen.includes(query) ||
                  keterangan.includes(query)
                );
              })
              .map((item, index) => {
                const { room, type, dosen, keterangan, time, borrowInfo } =
                  item;

                // Definisikan warna berdasarkan tipe status
                const statusColors = {
                  success: {
                    bg: "#F0FDF4",
                    text: "#166534",
                    icon: "checkmark-circle",
                  },
                  warning: {
                    bg: "#FFF7ED",
                    text: "#C2410C",
                    icon: "alert-circle",
                  },
                  danger: { bg: "#FEF2F2", text: "#EF4444", icon: "warning" },
                } as any;

                const currentStyle =
                  statusColors[borrowInfo.type] || statusColors.warning;

                return (
                  <View key={index} style={styles.modernRoomCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.roomBox}>
                        <ThemedText style={styles.roomText}>
                          {room.ruangid || room.nama_ruang}
                        </ThemedText>
                        <View style={styles.typeTag}>
                          <ThemedText style={styles.typeTagText}>
                            {type}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.timeTag}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="#EF4444"
                        />
                        <ThemedText style={styles.timeTagText}>
                          {time}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <ThemedText style={styles.dosenTxt}>{dosen}</ThemedText>
                      <ThemedText style={styles.subjectTxt} numberOfLines={1}>
                        {keterangan}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.cardFooter,
                        { backgroundColor: currentStyle.bg },
                      ]}
                    >
                      <Ionicons
                        name={currentStyle.icon}
                        size={16}
                        color={currentStyle.text}
                      />
                      <ThemedText
                        style={[
                          styles.statusNote,
                          { color: currentStyle.text },
                        ]}
                      >
                        {borrowInfo.status}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCircle}>
                <Ionicons name="checkmark-done" size={40} color="#22C55E" />
              </View>
              <ThemedText style={styles.emptyTitle}>
                Semua Ruangan Tersedia
              </ThemedText>
              <ThemedText style={styles.emptySub}>
                Tidak ada aktivitas perkuliahan saat ini.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Very Large Padding for Floating Navbar */}
        <View style={{ height: 180 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainScrollContent: {
    paddingTop: 24,
  },
  summarySection: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sumCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sumVal: {
    fontSize: 22,
    fontWeight: "800",
  },
  sumLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  searchWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modernSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },
  roomListWrapper: {
    paddingHorizontal: 24,
  },
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  activePill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  modernRoomCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  roomBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  typeTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dosenTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  subjectTxt: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusNote: {
    fontSize: 11,
    fontWeight: "600",
  },
  centerBox: {
    padding: 60,
    alignItems: "center",
  },
  statusText: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  errorMsg: {
    color: "#EF4444",
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "800",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
});
