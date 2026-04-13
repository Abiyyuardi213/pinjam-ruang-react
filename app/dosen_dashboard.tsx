import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';

export default function DosenDashboard() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  React.useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await apiService.getJadwal();
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText type="defaultSemiBold">Selamat Siang,</ThemedText>
            <ThemedText type="title">Dosen ITATS</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={fetchSchedules}>
            <Ionicons name="refresh" size={24} color={isDark ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>

        {/* Current Class Card - Mapping to first active if available */}
        <View style={styles.activeClassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.tag}>
              <ThemedText style={styles.tagText}>JADWAL BERIKUTNYA</ThemedText>
            </View>
            <ThemedText style={styles.roomText}>{schedules[0]?.ruang_id || '-'}</ThemedText>
          </View>
          <ThemedText style={styles.courseTitle}>{schedules[0]?.subject_name || 'Memuat Jadwal...'}</ThemedText>
          <ThemedText style={styles.courseTime}>
            {schedules[0]?.jam_mulai} - {schedules[0]?.jam_selesai || 'Selesai'}
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.qrButton} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="qr-code" size={20} color="#FFF" />
            <ThemedText style={styles.qrButtonText}>Tampilkan QR Masuk</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Upcoming Schedule */}
        <View style={styles.scheduleSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Semua Jadwal Hari Ini</ThemedText>
          
          {schedules.map((item, index) => (
            <ScheduleItem 
              key={index}
              day={item.hari || 'Hari'} 
              time={item.jam_mulai || '00:00'} 
              course={item.subject_name || 'Mata Kuliah'} 
              room={item.ruang_id || 'Ruang'} 
            />
          ))}

          {schedules.length === 0 && (
            <ThemedText style={{ opacity: 0.5, textAlign: 'center', marginTop: 20 }}>Tidak ada jadwal ditemukan.</ThemedText>
          )}
        </View>
      </ScrollView>

      {/* QR Code Modal Overlay */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModal} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <ThemedText style={styles.modalTitle}>QR Presensi Dosen</ThemedText>
            <ThemedText style={styles.modalSubtitle}>Scan oleh Admin/Tendik untuk masuk ruangan</ThemedText>
            
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={200} color="#1A4FA0" />
            </View>
            
            <View style={styles.lecturerInfo}>
              <ThemedText style={styles.lecturerName}>Dosen ITATS</ThemedText>
              <ThemedText style={styles.lecturerId}>NIDN. 07XXXXXXXX</ThemedText>
            </View>
            
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <ThemedText style={styles.timerText}>Berlaku selama 15:00</ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function ScheduleItem({ day, time, course, room }: any) {
  return (
    <View style={styles.scheduleItem}>
      <View style={styles.scheduleTimeContainer}>
        <ThemedText style={styles.scheduleDay}>{day}</ThemedText>
        <ThemedText style={styles.scheduleTime}>{time}</ThemedText>
      </View>
      <View style={styles.scheduleInfo}>
        <ThemedText style={styles.scheduleCourse}>{course}</ThemedText>
        <View style={styles.scheduleRoomContainer}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <ThemedText style={styles.scheduleRoom}>{room}</ThemedText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerText: {
    gap: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeClassCard: {
    backgroundColor: '#1A4FA0',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1A4FA0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roomText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 24,
  },
  qrButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  qrButtonText: {
    color: '#1A4FA0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  scheduleSection: {
    gap: 20,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  scheduleTimeContainer: {
    alignItems: 'center',
    width: 60,
  },
  scheduleDay: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A4FA0',
  },
  scheduleInfo: {
    flex: 1,
    gap: 4,
  },
  scheduleCourse: {
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleRoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  closeModal: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  qrPlaceholder: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    marginBottom: 32,
  },
  lecturerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lecturerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lecturerId: {
    fontSize: 13,
    color: '#666',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#666',
  }
});
