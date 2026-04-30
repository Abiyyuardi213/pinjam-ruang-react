import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import QRCode from 'react-native-qrcode-svg';

export default function LecturerScheduleDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Parse data from params
  const item = params.data ? JSON.parse(params.data as string) : null;

  const dayNames: Record<string, string> = {
    '1': 'Senin',
    '2': 'Selasa',
    '3': 'Rabu',
    '4': 'Kamis',
    '5': 'Jumat',
    '6': 'Sabtu',
    '7': 'Minggu',
  };

  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    accent: '#8B5CF6',
  };

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={theme.primary} />
        <ThemedText style={{ marginTop: 12 }}>Memuat detail...</ThemedText>
      </View>
    );
  }

  const qrData = `itatsqr1:d:${item.dosid || item.dosen_id}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Detail Jadwal</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.mainCard}>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{item.mkid || 'MK'}</ThemedText>
          </View>
          <ThemedText style={styles.subjectTitle}>{item.mknama || item.subject_name}</ThemedText>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={16} color="rgba(255,255,255,0.6)" />
              <ThemedText style={styles.metaText}>{item.sks || '3'} SKS</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.6)" />
              <ThemedText style={styles.metaText}>Kelas {item.kelas || '-'}</ThemedText>
            </View>
          </View>
        </View>

        {/* Schedule Details */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Waktu & Lokasi</ThemedText>
        </View>

        <View style={styles.infoSection}>
          <DetailRow 
            icon="calendar" 
            label="Hari" 
            value={dayNames[String(item.hari)] || item.hari} 
            color="#2563EB"
          />
          <DetailRow 
            icon="time" 
            label="Jam Perkuliahan" 
            value={`${(item.jammulai || item.jam_mulai || '').substring(0, 5)} - ${(item.jamhingga || item.jam_selesai || '').substring(0, 5)}`} 
            color="#F59E0B"
          />
          <DetailRow 
            icon="location" 
            label="Ruangan" 
            value={item.ruangket || item.ruangid || item.ruang_id} 
            color="#10B981"
          />
        </View>

        {/* QR Code Section for Presensi */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>QR Presensi Anda</ThemedText>
        </View>
        
        <View style={styles.qrCard}>
           <ThemedText style={styles.qrInfo}>Tunjukkan QR ini ke Admin saat meminjam kunci ruangan ini.</ThemedText>
           <View style={styles.qrWrapper}>
              <QRCode
                value={qrData}
                size={180}
                color="#000"
                backgroundColor="transparent"
              />
           </View>
           <View style={styles.lecturerInfo}>
              <ThemedText style={styles.lecturerName}>{item.dosnama || 'Dosen Pengampu'}</ThemedText>
              <ThemedText style={styles.lecturerId}>NIP. {item.dosid || item.dosen_id}</ThemedText>
           </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, color }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.iconBox, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.detailText}>
        <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        <ThemedText style={styles.detailValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#09090B',
  },
  scrollContent: { padding: 24 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subjectTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#09090B',
  },
  infoSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  qrInfo: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    marginBottom: 20,
  },
  lecturerInfo: {
    alignItems: 'center',
  },
  lecturerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  lecturerId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
});
