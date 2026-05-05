import React, { useState } from 'react';
import { storage } from '@/utils/storage';
import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { DosenSidebar } from '@/components/ui/dosen-sidebar';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function DosenDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  
  // Use professional light theme like admin
  const isDark = false;
  const theme = {
    bg: "#FAFAFA",
    headerBg: "#1E293B",
    text: "#09090B",
    mutedText: "#71717A",
    border: "#E4E4E7",
    primary: "#2563EB",
    cardBg: "#FFFFFF",
  };

  React.useEffect(() => {
    fetchSchedules();
    loadUser();
  }, [userData?.name]);

  const loadUser = async () => {
    const saved = await storage.getItem('user_data');
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch (e) {}
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await apiService.getJadwal();
      if (Array.isArray(response.data)) {
        // Get current day of week (1=Monday, 7=Sunday)
        const now = new Date();
        let currentDay = now.getDay();
        if (currentDay === 0) currentDay = 7; // Sunday is 7

        const lecturerId = String(userData?.name || userData?.id || '');

        const todaySchedules = response.data.filter((item: any) => {
          const isToday = String(item.hari) === String(currentDay);
          const isMine = String(item.dosid || item.dosen_id) === lecturerId;
          return isToday && isMine;
        });

        // Sort by time
        todaySchedules.sort((a: any, b: any) => {
          const timeA = a.jammulai || a.jam_mulai || '00:00';
          const timeB = b.jammulai || b.jam_mulai || '00:00';
          return timeA.localeCompare(timeB);
        });

        setSchedules(todaySchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const nextClass = schedules[0];

  const qrData = `itatsqr1:d:${userData?.name || userData?.id || ''}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <DosenSidebar 
        isVisible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Modern Header Section */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => setSidebarVisible(true)}
            >
              <Ionicons name="grid-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn}>
              <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarText}>
                  {(userData?.fullname || userData?.name || 'D').substring(0, 1).toUpperCase()}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <ThemedText style={styles.greetingText}>Selamat Siang,</ThemedText>
            <ThemedText style={styles.adminName}>{userData?.fullname || userData?.name || 'Dosen ITATS'}</ThemedText>
            <ThemedText style={styles.subGreeting}>
              Cek jadwal mengajar dan kelola presensi hari ini.
            </ThemedText>
          </View>
        </View>

        {/* Next Class Card - Bento Style */}
        <View style={styles.mainCardWrapper}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.activeClassCard}
            onPress={() => nextClass && router.push({
              pathname: '/dashboard-dosen/schedule-detail',
              params: { data: JSON.stringify(nextClass) }
            })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.tag}>
                <Ionicons name="notifications-outline" size={10} color="#FFF" style={{marginRight: 4}} />
                <ThemedText style={styles.tagText}>JADWAL BERIKUTNYA</ThemedText>
              </View>
              <View style={styles.roomTag}>
                <Ionicons name="location" size={12} color="#FFF" style={{marginRight: 4}} />
                <ThemedText style={styles.roomText}>{nextClass?.ruangid || nextClass?.ruang_id || '-'}</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.courseTitle} numberOfLines={2}>
              {nextClass?.mknama || nextClass?.subject_name || 'tidak ada jadwal mendatang'}
            </ThemedText>
            
            <View style={styles.timeInfoRow}>
               <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
               <ThemedText style={styles.courseTime}>
                 {nextClass ? `${(nextClass.jammulai || nextClass.jam_mulai || '').substring(0, 5)} - ${(nextClass.jamhingga || nextClass.jam_selesai || 'Selesai').substring(0, 5)}` : '--:--'}
               </ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.qrButton} 
              onPress={() => setModalVisible(true)}
              disabled={!nextClass}
            >
              <Ionicons name="qr-code" size={20} color={theme.primary} />
              <ThemedText style={styles.qrButtonText}>Tampilkan QR Masuk</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Upcoming Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Jadwal Hari Ini</ThemedText>
            <TouchableOpacity onPress={fetchSchedules} style={styles.refreshBtn}>
              <Ionicons name="reload" size={14} color={theme.primary} />
              <ThemedText style={styles.refreshText}>Refresh</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scheduleList}>
            {schedules.map((item, index) => (
              <ScheduleItem 
                key={index}
                item={item}
                isFirst={index === 0}
              />
            ))}

            {schedules.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#E2E8F0" />
                <ThemedText style={styles.emptyText}>tidak ada jadwal mendatang</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* QR Code Modal Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity 
              style={styles.closeModal} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#09090B" />
            </TouchableOpacity>
            
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>QR Presensi Dosen</ThemedText>
              <ThemedText style={styles.modalSubtitle}>Scan oleh Admin untuk validasi masuk ruangan</ThemedText>
            </View>
            
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <QRCode
                  value={qrData}
                  size={220}
                  color="#000"
                  backgroundColor="transparent"
                />
              </View>
              <View style={styles.qrBorder} />
            </View>
            
            <View style={styles.lecturerCard}>
              <View style={styles.lecturerAvatar}>
                <ThemedText style={styles.lecturerAvatarText}>
                  {(userData?.fullname || userData?.name || 'D').substring(0, 1).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.lecturerInfo}>
                <ThemedText style={styles.lecturerName}>{userData?.fullname || userData?.name || 'Dosen ITATS'}</ThemedText>
                <ThemedText style={styles.lecturerId}>NIDN. {userData?.nip || '0725048901'}</ThemedText>
              </View>
            </View>
            
            <View style={styles.timerBadge}>
              <Ionicons name="time" size={14} color="#F59E0B" />
              <ThemedText style={styles.timerText}>Berlaku selama 15:00</ThemedText>
            </View>

            <TouchableOpacity 
              style={styles.doneBtn}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.doneBtnText}>Selesai</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ScheduleItem({ item, isFirst }: any) {
  const router = useRouter();
  const dayNames: Record<string, string> = {
    '1': 'Senin',
    '2': 'Selasa',
    '3': 'Rabu',
    '4': 'Kamis',
    '5': 'Jumat',
    '6': 'Sabtu',
    '7': 'Minggu',
  };

  const dayName = dayNames[String(item.hari)] || item.hari;

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.scheduleItem}
      onPress={() => router.push({
        pathname: '/dashboard-dosen/schedule-detail',
        params: { data: JSON.stringify(item) }
      })}
    >
      <View style={[styles.timeIndicator, { backgroundColor: isFirst ? '#2563EB' : '#E2E8F0' }]} />
      <View style={styles.scheduleMain}>
        <View style={styles.scheduleHeader}>
          <ThemedText style={styles.scheduleCourse} numberOfLines={1}>{item.mknama || item.subject_name}</ThemedText>
          <View style={styles.statusBadge}>
             <ThemedText style={styles.statusBadgeText}>{dayName}</ThemedText>
          </View>
        </View>
        
        <View style={styles.scheduleFooter}>
          <View style={styles.scheduleMeta}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <ThemedText style={styles.scheduleMetaText}>
              {(item.jammulai || item.jam_mulai || '').substring(0, 5)} - {(item.jamhingga || item.jam_selesai || '').substring(0, 5)}
            </ThemedText>
          </View>
          <View style={styles.scheduleMeta}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <ThemedText style={styles.scheduleMetaText}>{item.ruangid || item.ruang_id}</ThemedText>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
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
    paddingBottom: 60,
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
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  mainCardWrapper: {
    paddingHorizontal: 24,
    marginTop: -40,
  },
  activeClassCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    padding: 24,
    elevation: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roomText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  courseTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  courseTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  qrButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
  },
  qrButtonText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 15,
  },
  scheduleSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090B",
    letterSpacing: -0.5,
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
  refreshText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  scheduleMain: {
    flex: 1,
    gap: 6,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleCourse: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  scheduleFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 20,
  },
  closeModal: {
    position: 'absolute',
    right: 24,
    top: 24,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#09090B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  qrContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  qrPlaceholder: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrBorder: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 36,
    opacity: 0.2,
  },
  lecturerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  lecturerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lecturerAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  lecturerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  lecturerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  lecturerId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 32,
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
