import { ThemedText } from "@/components/themed-text";
import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
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
  Modal,
} from "react-native";

import { AdminHeader } from "@/components/ui/admin-header";

export default function AdminMonitor() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [borrowings, setBorrowings] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [clockTime, setClockTime] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState("");
  const [selectedBuilding, setSelectedBuilding] = React.useState("Semua Gedung");
  const [showBuildingDropdown, setShowBuildingDropdown] = React.useState(false);
  const [selectedRoomForSchedule, setSelectedRoomForSchedule] = React.useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = React.useState(false);

  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
  };

  const getMatchedBorrowing = (sched: any, roomId: string) => {
    if (!sched) return null;
    const sRoomId = String(roomId || "").toUpperCase();
    const schedDosId = String(sched.dosid || sched.dosen_id || "").toUpperCase();
    const schedStart = sched.jammulai || sched.jam_mulai || "";
    const schedEnd = sched.jamhingga || sched.jam_hingga || "";
    
    if (!schedStart || !schedEnd) return null;
    
    const toMins = (t: string) => {
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };
    
    const startMins = toMins(schedStart);
    const endMins = toMins(schedEnd);
    
    // Filter borrowings for the same room today
    const candidateBorrowings = borrowings.filter((b: any) => {
      const bRoomId = String(b.ruang_id || "").toUpperCase();
      // Match room
      if (bRoomId !== sRoomId) return false;
      
      const pinjamTime = b.waktu_pinjam || "";
      if (!pinjamTime || pinjamTime === "-") return false;
      
      const pinjamMins = toMins(pinjamTime);
      // Check if borrowing time falls within [startMins - 40, endMins - 10]
      return pinjamMins >= startMins - 40 && pinjamMins <= endMins - 10;
    });
    
    if (candidateBorrowings.length === 0) return null;
    
    // First priority: exact lecturer match
    const exactLecturer = candidateBorrowings.find((b: any) => {
      const bDosId = String(b.dosen_id || "").toUpperCase();
      return bDosId === schedDosId;
    });
    
    if (exactLecturer) return exactLecturer;
    
    // Second priority: closest borrowing time
    return candidateBorrowings.reduce((closest: any, current: any) => {
      if (!closest) return current;
      const closestMins = toMins(closest.waktu_pinjam);
      const currentMins = toMins(current.waktu_pinjam);
      const diffClosest = Math.abs(closestMins - startMins);
      const diffCurrent = Math.abs(currentMins - startMins);
      return diffCurrent < diffClosest ? current : closest;
    }, null);
  };

  const isScheduleActive = (sched: any) => {
    if (!sched) return false;
    const now = new Date();
    let currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
    if (currentDay === 0) currentDay = 7; // Sunday = 7
    
    // Check if same day of week
    if (String(sched.hari) !== String(currentDay)) return false;
    
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}:00`;
    
    const start = sched.jammulai || sched.jam_mulai;
    const end = sched.jamhingga || sched.jam_hingga;
    
    return currentTime >= start && currentTime < end;
  };

  const getBatasPinjam = (jamMulai?: string, jamHingga?: string) => {
    if (!jamMulai || !jamHingga) return "-";
    const subMin = (timeStr: string, mins: number) => {
      const parts = timeStr.split(":");
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return timeStr;
      m -= mins;
      if (m < 0) {
        h -= 1;
        m += 60;
      }
      if (h < 0) h = 23;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    return `${subMin(jamMulai, 10)} - ${subMin(jamHingga, 10)}`;
  };

  const getDurasiPerkuliahan = (pinjam?: string, kembali?: string | null) => {
    if (!pinjam || pinjam === "-" || !kembali || kembali === "-") return "-";
    const toMins = (t: string) => {
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };
    const diff = toMins(kembali) - toMins(pinjam);
    if (diff <= 0) return "-";
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} jam ${mins} menit`;
    } else if (hrs > 0) {
      return `${hrs} jam`;
    } else {
      return `${mins} menit`;
    }
  };

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setClockTime(`${hh}.${mm}.${ss}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoomBuildingName = (roomId: string) => {
    const idStr = String(roomId || "").toUpperCase();
    if (idStr.startsWith("A")) return "Gedung A";
    if (idStr.startsWith("B")) return "Gedung B";
    if (idStr.startsWith("C")) return "Gedung C";
    if (idStr.startsWith("D")) return "Gedung D";
    if (idStr.includes("-")) {
      const prefix = idStr.split("-")[0].trim();
      if (prefix.length === 1) {
        return `Gedung ${prefix}`;
      }
    } else {
      const match = idStr.match(/^([A-Za-z]+)/);
      if (match) {
        return `Gedung ${match[1]}`;
      }
    }
    return "Lainnya";
  };

  const getUniqueBuildings = () => {
    const buildings = new Set<string>();
    rooms.forEach(r => {
      buildings.add(getRoomBuildingName(r.ruangid));
    });
    return ["Semua Gedung", ...Array.from(buildings).sort()];
  };

  const getBuildingStats = () => {
    const buildingMap: { [key: string]: { total: number; occupied: number } } = {};

    rooms.forEach(r => {
      const buildingName = getRoomBuildingName(r.ruangid);
      if (!buildingMap[buildingName]) {
        buildingMap[buildingName] = { total: 0, occupied: 0 };
      }
      buildingMap[buildingName].total += 1;
    });

    activeItems.forEach(item => {
      if (item.statusCategory === "dipinjam") {
        const buildingName = getRoomBuildingName(item.room.ruangid || item.room.nama_ruang);
        if (buildingMap[buildingName]) {
          buildingMap[buildingName].occupied += 1;
        }
      }
    });

    return Object.keys(buildingMap)
      .map(name => {
        const total = buildingMap[name].total;
        const occupied = buildingMap[name].occupied;
        const percentageStr = total > 0 ? ((occupied / total) * 100).toFixed(2) : "0.00";
        const percentageVal = total > 0 ? (occupied / total) * 100 : 0;
        return { name, total, occupied, percentageStr, percentageVal };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

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
  const [activeFilter, setActiveFilter] = React.useState<"semua" | "available" | "ada jadwal" | "dipinjam">("semua");

  const getFilterCount = (filterId: string) => {
    if (filterId === "semua") return activeItems.length;
    return activeItems.filter(item => item.statusCategory === filterId).length;
  };

  const getFilteredItems = () => {
    return activeItems
      .filter((item) => {
        // 1. Filter by Building
        if (selectedBuilding !== "Semua Gedung") {
          const itemBuildingName = getRoomBuildingName(item.room.ruangid || item.room.nama_ruang);
          if (itemBuildingName !== selectedBuilding) {
            return false;
          }
        }

        // 2. Filter by category
        if (activeFilter !== "semua" && item.statusCategory !== activeFilter) {
          return false;
        }
        
        // 3. Filter by search query
        const query = searchQuery.toLowerCase();
        const roomId = String(item.room.ruangid || item.room.nama_ruang || "").toLowerCase();
        const dosen = String(item.dosen || "").toLowerCase();
        const keterangan = String(item.keterangan || "").toLowerCase();
        
        return (
          roomId.includes(query) ||
          dosen.includes(query) ||
          keterangan.includes(query)
        );
      })
      .sort((a, b) => {
        const labelA = String(a.room.ruangid || a.room.nama_ruang || a.room.id || "");
        const labelB = String(b.room.ruangid || b.room.nama_ruang || b.room.id || "");
        return labelA.localeCompare(labelB);
      });
  };

  const fetchData = React.useCallback(async (isPolling: boolean | any = false) => {
    const isPolled = isPolling === true;
    if (!isPolled) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      console.log(`[MONITOR] Fetching data for ${today}...`);

      const [ruangResp, jadwalResp, pinjamResp] = await Promise.all([
        apiService.getRuang(),
        apiService.getJadwal(),
        apiService.getPeminjaman(), // Hapus filter today agar sinkron dengan dashboard jika dashboard tidak pakai filter tanggal
      ]);

      const roomList = Array.isArray(ruangResp.data) ? ruangResp.data : [];
      const schedulesList = Array.isArray(jadwalResp.data) ? jadwalResp.data : [];
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

      // 1. Tampilkan semua Jadwal yang Seharusnya Berlangsung Saat Ini atau yang Sedang Dipinjam
      activeRooms.forEach((room: any) => {
        const roomId = String(room.ruangid || room.nama_ruang || "").toUpperCase();
        
        // Cari jadwal untuk ruangan ini yang sedang berlangsung
        const currentSchedule = schedulesList.find((s: any) => {
          const sRoomId = String(s.ruangid || s.ruang_id || "").toUpperCase();
          const sameRoom = sRoomId === roomId;
          const sameDay = String(s.hari) === String(currentDay);
          if (!sameRoom || !sameDay) return false;

          const start = s.jammulai || s.jam_mulai;
          const end = s.jamhingga || s.jam_hingga;
          return currentTime >= start && currentTime < end;
        });

        // Cari semua jadwal untuk ruangan ini hari ini
        const todaySchedules = schedulesList.filter((s: any) => {
          const sRoomId = String(s.ruangid || s.ruang_id || "").toUpperCase();
          const sameRoom = sRoomId === roomId;
          const sameDay = String(s.hari) === String(currentDay);
          return sameRoom && sameDay;
        }).sort((a: any, b: any) => {
          const startA = a.jammulai || a.jam_mulai || "";
          const startB = b.jammulai || b.jam_mulai || "";
          return startA.localeCompare(startB);
        });

        // Cek apakah ada yang sedang meminjam ruangan ini (berdasarkan status 'Dipinjam')
        const roomBorrowing = borrowings.find((b: any) => 
          String(b.ruang_id).toUpperCase() === roomId && b.status === "Dipinjam"
        );

        let statusCategory = "available";
        let type = "Tersedia";
        let dosen = "-";
        let keterangan = "Ruangan Kosong";
        let time = "-";
        let borrowInfo: { status: string; type: string; actualRoom: string | null } = {
          status: "Tersedia & Kosong",
          type: "success",
          actualRoom: null
        };

        if (roomBorrowing) {
          statusCategory = "dipinjam";
          if (currentSchedule) {
            const scheduledDosId = String(currentSchedule.dosid || currentSchedule.dosen_id);
            const borrowerId = String(roomBorrowing.dosen_id);
            
            type = "Jadwal Kuliah";
            dosen = currentSchedule.dosnama || "Dosen ITATS";
            keterangan = currentSchedule.mknama;
            time = `${(currentSchedule.jammulai || "").substring(0, 5)} - ${(currentSchedule.jamhingga || "").substring(0, 5)}`;
            
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
            type = "Peminjaman Luar Jadwal";
            dosen = roomBorrowing.dosen_name;
            keterangan = "Kegiatan Mandiri / Pengganti";
            time = `${roomBorrowing.waktu_pinjam} - Selesai`;
            borrowInfo = {
              status: "Kunci sudah diambil",
              type: "success",
              actualRoom: roomId
            };
          }
        } else if (currentSchedule) {
          statusCategory = "ada jadwal";
          const scheduledDosId = String(currentSchedule.dosid || currentSchedule.dosen_id);
          type = "Jadwal Kuliah";
          dosen = currentSchedule.dosnama || "Dosen ITATS";
          keterangan = currentSchedule.mknama;
          time = `${(currentSchedule.jammulai || "").substring(0, 5)} - ${(currentSchedule.jamhingga || "").substring(0, 5)}`;

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
            } else {
              borrowInfo = {
                status: "Kunci belum diambil",
                type: "warning",
                actualRoom: null
              };
            }
          }
        }

        monitoringResults.push({
          room,
          statusCategory,
          type,
          dosen,
          keterangan,
          time,
          borrowInfo,
          todaySchedules
        });
        
        handledRoomIds.add(roomId);
      });

      // 2. Tambahkan Ruangan yang sedang dipinjam tapi tidak ada di activeRooms (safety check)
      borrowings.forEach((borrow: any) => {
        if (borrow.status === 'Dipinjam') {
          const roomId = String(borrow.ruang_id).toUpperCase();
          if (handledRoomIds.has(roomId)) return;

          const roomObj = roomList.find((r: any) => String(r.ruangid).toUpperCase() === roomId) || { ruangid: borrow.ruang_id };

          const todaySchedules = schedulesList.filter((s: any) => {
            const sRoomId = String(s.ruangid || s.ruang_id || "").toUpperCase();
            const sameRoom = sRoomId === roomId;
            const sameDay = String(s.hari) === String(currentDay);
            return sameRoom && sameDay;
          }).sort((a: any, b: any) => {
            const startA = a.jammulai || a.jam_mulai || "";
            const startB = b.jammulai || b.jam_mulai || "";
            return startA.localeCompare(startB);
          });

          monitoringResults.push({
            room: roomObj,
            statusCategory: "dipinjam",
            type: "Peminjaman Luar Jadwal",
            dosen: borrow.dosen_name,
            keterangan: "Kegiatan Mandiri / Pengganti",
            time: `${borrow.waktu_pinjam} - Selesai`,
            borrowInfo: {
              status: "Kunci sudah diambil",
              type: "success",
              actualRoom: roomId
            },
            todaySchedules
          });
        }
      });

      setActiveItems(monitoringResults);
      setRooms(activeRooms); 
      setSchedules(schedulesList);
      setBorrowings(borrowings);
      setLastUpdated(getFormattedDateTime());
    } catch (err) {
      console.error("Error fetching monitor data:", err);
      if (!isPolled) {
        setError("Gagal mengambil data monitoring terbaru.");
      }
    } finally {
      if (!isPolled) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData(false);

      const interval = setInterval(() => {
        fetchData(true);
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }, [fetchData])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <AdminHeader
        title="Monitor Gedung"
        subtitle="Real-time Penggunaan Ruang ITATS"
        showBack={true}
        onBack={() => router.push('/dashboard-admin')}
        rightIcon="sync"
        onRightPress={fetchData}
      />

      <ScrollView
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section matching the image */}
        <LinearGradient
          colors={["#1E293B", "#0F172A"]}
          style={styles.bannerCard}
        >
          <ThemedText style={styles.bannerTitle}>
            Monitor Ruang (Thumbnail)
          </ThemedText>
          <ThemedText style={styles.bannerDesc}>
            Status ruang ditampilkan seperti layout kursi: hijau saat available, kuning saat ada jadwal kuliah, merah saat sedang dipinjam.
          </ThemedText>
          
          <View style={styles.bannerBadgeRow}>
            <View style={styles.whitePill}>
              <ThemedText style={styles.whitePillText}>
                Update terakhir: {lastUpdated || "-"}
              </ThemedText>
            </View>
            <View style={styles.darkPill}>
              <ThemedText style={styles.darkPillText}>
                {clockTime || "-"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.bannerButtonRow}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push('/dashboard-admin/mapping')}
              style={styles.yellowBtn}
            >
              <Ionicons name="list" size={18} color="#09090B" />
              <ThemedText style={styles.yellowBtnText}>
                Rekap Jadwal Kunci
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={fetchData}
              style={styles.whiteBtn}
            >
              <Ionicons name="refresh" size={18} color="#09090B" />
              <ThemedText style={styles.whiteBtnText}>
                Refresh
              </ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 4 Summary Cards matching the image */}
        <View style={styles.verticalSummaryContainer}>
          <View style={styles.summaryVerticalCard}>
            <ThemedText style={styles.summaryCardLabel}>TOTAL RUANG</ThemedText>
            <ThemedText style={styles.summaryCardVal}>{rooms.length}</ThemedText>
          </View>

          <View style={styles.summaryVerticalCard}>
            <ThemedText style={styles.summaryCardLabel}>AVAILABLE</ThemedText>
            <ThemedText style={[styles.summaryCardVal, { color: "#22C55E" }]}>
              {activeItems.filter(i => i.statusCategory === "available").length}
            </ThemedText>
          </View>

          <View style={styles.summaryVerticalCard}>
            <ThemedText style={styles.summaryCardLabel}>ADA JADWAL</ThemedText>
            <ThemedText style={[styles.summaryCardVal, { color: "#D97706" }]}>
              {activeItems.filter(i => i.statusCategory === "ada jadwal").length}
            </ThemedText>
          </View>

          <View style={styles.summaryVerticalCard}>
            <ThemedText style={styles.summaryCardLabel}>SEDANG DIPINJAM</ThemedText>
            <ThemedText style={[styles.summaryCardVal, { color: "#EF4444" }]}>
              {activeItems.filter(i => i.statusCategory === "dipinjam").length}
            </ThemedText>
          </View>
        </View>

        {/* Building Stats Section (Gedung progress bars) */}
        <View style={styles.buildingSection}>
          {getBuildingStats().map((b, idx) => (
            <View key={idx} style={styles.buildingCard}>
              <View style={styles.buildingHeader}>
                <ThemedText style={styles.buildingTitle}>
                  {b.name} ({b.occupied}/{b.total}) - {b.percentageStr}%
                </ThemedText>
                <ThemedText style={styles.buildingSub}>
                  RUANG SEDANG DIPINJAM
                </ThemedText>
              </View>
              <View style={styles.progressBarBg}>
                {b.percentageVal > 0 && (
                  <LinearGradient
                    colors={["#22C55E", "#EAB308", "#EF4444"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${b.percentageVal}%` }
                    ]}
                  />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* GEDUNG Selector Card */}
        <View style={styles.gedungSelectorWrapper}>
          <ThemedText style={styles.gedungLabel}>GEDUNG</ThemedText>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setShowBuildingDropdown(!showBuildingDropdown)}
            style={styles.gedungDropdownBtn}
          >
            <View style={styles.gedungDropdownLeft}>
              <Ionicons name="business" size={20} color="#1E293B" />
              <ThemedText style={styles.gedungDropdownText}>
                {selectedBuilding}
              </ThemedText>
            </View>
            <Ionicons 
              name={showBuildingDropdown ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#94A3B8" 
            />
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showBuildingDropdown && (
            <View style={styles.gedungDropdownList}>
              {getUniqueBuildings().map((b, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedBuilding(b);
                    setShowBuildingDropdown(false);
                  }}
                  style={[
                    styles.gedungDropdownItem,
                    selectedBuilding === b && styles.gedungDropdownItemActive
                  ]}
                >
                  <ThemedText 
                    style={[
                      styles.gedungDropdownItemText,
                      selectedBuilding === b && styles.gedungDropdownItemTextActive
                    ]}
                  >
                    {b}
                  </ThemedText>
                  {selectedBuilding === b && (
                    <Ionicons name="checkmark" size={16} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Status Legend Row */}
        <View style={styles.legendContainer}>
          <View style={[styles.legendPill, { backgroundColor: "#EEFBF3" }]}>
            <View style={[styles.legendDot, { backgroundColor: "#16A34A" }]} />
            <ThemedText style={styles.legendText}>Available</ThemedText>
          </View>
          <View style={[styles.legendPill, { backgroundColor: "#FFF7ED" }]}>
            <View style={[styles.legendDot, { backgroundColor: "#D97706" }]} />
            <ThemedText style={styles.legendText}>Ada Jadwal</ThemedText>
          </View>
          <View style={[styles.legendPill, { backgroundColor: "#FEF2F2" }]}>
            <View style={[styles.legendDot, { backgroundColor: "#DC2626" }]} />
            <ThemedText style={styles.legendText}>Sedang Dipinjam</ThemedText>
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

        {/* Filter Pills Row */}
        <View style={styles.filterPillsRow}>
          {[
            { id: "semua", label: "Semua" },
            { id: "available", label: "Available" },
            { id: "ada jadwal", label: "Ada Jadwal" },
            { id: "dipinjam", label: "Dipinjam" },
          ].map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id as any)}
                style={[
                  styles.filterPillBtn,
                  isActive ? styles.filterPillActive : styles.filterPillInactive
                ]}
              >
                <ThemedText 
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive
                  ]}
                >
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Classroom Grid */}
        <View style={styles.roomListWrapper}>
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
          ) : getFilteredItems().length > 0 ? (
            <View style={styles.gridContainer}>
              {getFilteredItems().map((item, index) => {
                const { room, statusCategory, dosen, time } = item;
                
                let cardBg = "#16A34A"; // default available
                let statusLabel = "AVAILABLE";
                if (statusCategory === "ada jadwal") {
                  cardBg = "#D97706";
                  statusLabel = "ADA JADWAL";
                } else if (statusCategory === "dipinjam") {
                  cardBg = "#DC2626";
                  statusLabel = "SEDANG DIPINJAM";
                }

                const kapasitas = room.ruangkapasitas || 0;
                const deskripsi = room.ruangket || room.ruangid;
                const buildingName = getRoomBuildingName(room.ruangid);

                const peminjam = statusCategory === "available" ? "-" : (dosen || "-");
                const waktuPinjam = statusCategory === "available" ? "-" : (time.split("-")[0]?.trim() || "-");
                const waktuKembali = statusCategory === "available" ? "-" : (time.split("-")[1]?.trim() || "-");

                return (
                  <View 
                    key={index} 
                    style={[styles.gridCard, { backgroundColor: cardBg }]}
                  >
                    {/* Header Row */}
                    <View style={styles.cardHeaderRow}>
                      <ThemedText style={styles.cardStatusLabel}>
                        {statusLabel}
                      </ThemedText>
                      <View style={styles.capacityBadge}>
                        <ThemedText style={styles.capacityBadgeText}>
                          Kapasitas: {kapasitas}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Main Title */}
                    <ThemedText style={styles.cardRoomId}>
                      {room.ruangid}
                    </ThemedText>

                    {/* Room Description */}
                    <ThemedText style={styles.cardRoomDesc} numberOfLines={2}>
                      {deskripsi}
                    </ThemedText>

                    {/* Building Badge */}
                    <View style={styles.cardBuildingBadge}>
                      <Ionicons name="business" size={12} color="#FFF" />
                      <ThemedText style={styles.cardBuildingBadgeText}>
                        {buildingName}
                      </ThemedText>
                    </View>

                    {/* Divider Line */}
                    <View style={styles.cardDivider} />

                    {/* Info Block */}
                    <View style={styles.cardInfoBlock}>
                      <ThemedText style={styles.cardInfoText} numberOfLines={1}>
                        Peminjam: {peminjam}
                      </ThemedText>
                      <ThemedText style={styles.cardInfoText} numberOfLines={1}>
                        Waktu Pinjam: {waktuPinjam}
                      </ThemedText>
                      <ThemedText style={styles.cardInfoText} numberOfLines={1}>
                        Waktu Kembali: {waktuKembali}
                      </ThemedText>
                    </View>

                    {/* Today's Schedule Button */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.cardScheduleBtn}
                      onPress={() => {
                        setSelectedRoomForSchedule(item);
                        setShowScheduleModal(true);
                      }}
                    >
                      <Ionicons name="calendar-sharp" size={12} color="#09090B" />
                      <ThemedText style={styles.cardScheduleBtnText}>
                        Jadwal Hari Ini ({item.todaySchedules ? item.todaySchedules.length : 0})
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyCircle, { backgroundColor: activeFilter === 'available' ? '#F0FDF4' : '#F8FAFC' }]}>
                <Ionicons 
                  name={
                    activeFilter === 'available' ? 'checkmark-done' :
                    activeFilter === 'ada jadwal' ? 'calendar-outline' :
                    activeFilter === 'dipinjam' ? 'key-outline' : 'search-outline'
                  } 
                  size={40} 
                  color={activeFilter === 'available' ? '#22C55E' : '#64748B'} 
                />
              </View>
              <ThemedText style={styles.emptyTitle}>
                {
                  activeFilter === 'available' ? 'Tidak Ada Ruangan Tersedia' :
                  activeFilter === 'ada jadwal' ? 'Tidak Ada Jadwal Kuliah' :
                  activeFilter === 'dipinjam' ? 'Tidak Ada Ruang Dipinjam' :
                  'Tidak Menemukan Hasil'
                }
              </ThemedText>
              <ThemedText style={styles.emptySub}>
                {
                  activeFilter === 'available' ? 'Semua ruangan sedang digunakan atau terjadwal.' :
                  activeFilter === 'ada jadwal' ? 'Saat ini tidak ada kelas yang berlangsung.' :
                  activeFilter === 'dipinjam' ? 'Semua kunci ruangan berada di admin.' :
                  'Coba periksa kembali kata kunci pencarian Anda.'
                }
              </ThemedText>
            </View>
          )}
        </View>

        {/* Very Large Padding for Floating Navbar */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Schedule Detail Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Jadwal {selectedRoomForSchedule?.room?.ruangid || ""}
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setShowScheduleModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#09090B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedRoomForSchedule?.todaySchedules && selectedRoomForSchedule.todaySchedules.length > 0 ? (
                selectedRoomForSchedule.todaySchedules.map((sched: any, idx: number) => {
                  const roomId = selectedRoomForSchedule?.room?.ruangid || "";
                  const borrowing = getMatchedBorrowing(sched, roomId);
                  const isBorrowed = !!borrowing;
                  const isReturned = borrowing?.status === "Kembali";
                  const isActive = isScheduleActive(sched);
                  
                  const isDifferentLecturer = isBorrowed && 
                    String(borrowing.dosen_id || "").toUpperCase() !== String(sched.dosid || sched.dosen_id || "").toUpperCase();

                  // Determine card colors
                  let cardBorderColor = "#E4E4E7"; // default gray
                  let cardBgColor = "#FFFFFF";
                  
                  if (isBorrowed) {
                    if (isReturned) {
                      cardBorderColor = "#22C55E"; // green
                      cardBgColor = "#F0FDF4";
                    } else {
                      cardBorderColor = "#EF4444"; // red
                      cardBgColor = "#FEF2F2";
                    }
                  } else if (isActive) {
                    cardBorderColor = "#F97316"; // orange
                    cardBgColor = "#FFF7ED";
                  }

                  const formatTime = (t?: string) => {
                    if (!t) return "";
                    return t.substring(0, 5);
                  };

                  const startStr = formatTime(sched.jammulai || sched.jam_mulai);
                  const endStr = formatTime(sched.jamhingga || sched.jam_hingga);
                  const batasStr = getBatasPinjam(sched.jammulai || sched.jam_mulai, sched.jamhingga || sched.jam_hingga);

                  const courseId = sched.mkid || sched.mk_id || "";
                  const courseName = sched.mknama || sched.matkul_nama || sched.matkul || "";
                  const className = sched.kelas || "";
                  const lecturerId = sched.dosid || sched.dosen_id || "";
                  const lecturerName = sched.dosnama || sched.dosen_name || "";

                  const actualBorrowerId = borrowing?.dosen_id || "";
                  const actualBorrowerName = borrowing?.dosen_name || "";
                  const waktuPinjam = borrowing?.waktu_pinjam || "";
                  const waktuKembali = borrowing?.waktu_kembali || "";
                  const durasi = getDurasiPerkuliahan(waktuPinjam, waktuKembali);

                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.scheduleCard, 
                        { borderColor: cardBorderColor, backgroundColor: cardBgColor }
                      ]}
                    >
                      {/* First Row: Time and Badges */}
                      <View style={styles.scheduleHeaderRow}>
                        <ThemedText style={styles.scheduleTimeRange}>
                          {startStr} - {endStr}
                        </ThemedText>
                        <View style={styles.scheduleBadgeContainer}>
                          {isReturned && (
                            <View style={[styles.badgePill, { backgroundColor: "#22C55E" }]}>
                              <ThemedText style={styles.badgeText}>KUNCI SUDAH DIKEMBALIKAN</ThemedText>
                            </View>
                          )}
                          {isBorrowed && !isReturned && (
                            <View style={[styles.badgePill, { backgroundColor: "#EF4444" }]}>
                              <ThemedText style={styles.badgeText}>KUNCI DIPINJAM</ThemedText>
                            </View>
                          )}
                          {isActive && (
                            <View style={[styles.badgePill, { backgroundColor: "#F59E0B" }]}>
                              <ThemedText style={styles.badgeText}>AKTIF</ThemedText>
                            </View>
                          )}
                          {isDifferentLecturer && (
                            <View style={[styles.badgePill, { backgroundColor: "#7F1D1D" }]}>
                              <ThemedText style={styles.badgeText}>DOSEN BERBEDA</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Course details */}
                      <ThemedText style={styles.scheduleCourseName}>
                        {courseId} - {courseName}
                      </ThemedText>

                      {/* Batas Pinjam */}
                      <ThemedText style={styles.scheduleTextNormal}>
                        <ThemedText style={styles.scheduleTextBold}>Batas Pinjam: </ThemedText>
                        {batasStr}
                      </ThemedText>

                      {/* Class */}
                      <ThemedText style={styles.scheduleTextNormal}>
                        Kelas {className}
                      </ThemedText>

                      {/* Scheduled Lecturer */}
                      <ThemedText style={styles.scheduleTextNormal}>
                        {lecturerId} - {lecturerName}
                      </ThemedText>

                      {/* Borrowing record details if any */}
                      {isBorrowed && (
                        <>
                          <ThemedText style={styles.scheduleTextNormal}>
                            <ThemedText style={styles.scheduleTextBold}>Peminjam: </ThemedText>
                            {actualBorrowerId} - {actualBorrowerName}
                          </ThemedText>

                          <ThemedText style={styles.scheduleTextNormal}>
                            <ThemedText style={styles.scheduleTextBold}>Waktu Pinjam: </ThemedText>
                            {waktuPinjam}
                          </ThemedText>

                          <ThemedText style={styles.scheduleTextNormal}>
                            <ThemedText style={styles.scheduleTextBold}>Waktu Kembali: </ThemedText>
                            {waktuKembali || "-"}
                          </ThemedText>

                          <ThemedText style={styles.scheduleTextNormal}>
                            <ThemedText style={styles.scheduleTextBold}>Durasi Perkuliahan: </ThemedText>
                            {durasi}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.modalEmptyBox}>
                  <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
                  <ThemedText style={styles.modalEmptyText}>
                    Tidak ada jadwal kuliah hari ini.
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowScheduleModal(false)}
              style={styles.modalCloseActionBtn}
            >
              <ThemedText style={styles.modalCloseActionBtnText}>Tutup</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
  bannerCard: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  bannerDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  whitePill: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  whitePillText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
  },
  darkPill: {
    backgroundColor: "#18181B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  darkPillText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bannerButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  yellowBtn: {
    backgroundColor: "#FACC15",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  yellowBtnText: {
    color: "#09090B",
    fontWeight: "700",
    fontSize: 13,
  },
  whiteBtn: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  whiteBtnText: {
    color: "#09090B",
    fontWeight: "700",
    fontSize: 13,
  },
  verticalSummaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  summaryVerticalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryCardVal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#09090B",
  },
  buildingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  buildingCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buildingHeader: {
    marginBottom: 12,
  },
  buildingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  buildingSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  // GEDUNG DROPDOWN STYLES
  gedungSelectorWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
    zIndex: 10, // Ensure dropdown overlays contents below it
  },
  gedungLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    letterSpacing: 1,
    marginBottom: 8,
  },
  gedungDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  gedungDropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gedungDropdownText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#18181B",
  },
  gedungDropdownList: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gedungDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  gedungDropdownItemActive: {
    backgroundColor: "#EFF6FF",
  },
  gedungDropdownItemText: {
    fontSize: 14,
    color: "#27272A",
    fontWeight: "500",
  },
  gedungDropdownItemTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },

  // STATUS LEGEND STYLES
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },

  // FILTER PILLS STYLES
  filterPillsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterPillBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 100,
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
  },
  filterPillInactive: {
    backgroundColor: "#E4E4E7",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: "#FFF",
  },
  filterPillTextInactive: {
    color: "#3F3F46",
  },

  // GRID CARD STYLES
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  gridCard: {
    width: "48%",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardStatusLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFF",
    opacity: 0.9,
  },
  capacityBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capacityBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
  },
  cardRoomId: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 2,
  },
  cardRoomDesc: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.9,
    marginBottom: 10,
  },
  cardBuildingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 14,
  },
  cardBuildingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginBottom: 14,
  },
  cardInfoBlock: {
    marginBottom: 16,
    gap: 4,
  },
  cardInfoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
    opacity: 0.95,
  },
  cardScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  cardScheduleBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#09090B",
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 9, 11, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 650,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3F3F46",
    textAlign: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    right: 0,
    padding: 4,
  },
  modalScroll: {
    maxHeight: 500,
    marginBottom: 20,
  },
  // SCHEDULE CARD STYLES MATCHING THE IMAGE
  scheduleCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  scheduleTimeRange: {
    fontSize: 16,
    fontWeight: "800",
    color: "#B45309",
  },
  scheduleBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  scheduleCourseName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#18181B",
    marginBottom: 8,
  },
  scheduleTextNormal: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 4,
  },
  scheduleTextBold: {
    fontWeight: "700",
    color: "#374151",
  },
  modalEmptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  modalEmptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  modalCloseActionBtn: {
    backgroundColor: "#09090B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
