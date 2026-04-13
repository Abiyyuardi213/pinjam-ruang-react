import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiService } from '@/services/api';

export default function AdminMonitor() {
  const colorScheme = useColorScheme();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const isDark = colorScheme === 'dark';

  React.useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await apiService.getRuang();
      if (response.data) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText type="title" style={styles.title}>Pantau Ruangan</ThemedText>
                <TouchableOpacity onPress={fetchRooms}>
                    <Ionicons name="refresh" size={24} color="#1A4FA0" />
                </TouchableOpacity>
            </View>
            <ThemedText style={styles.subtitle}>Status penggunaan {rooms.length} ruangan kampus saat ini.</ThemedText>
          </View>

          <View style={styles.roomGrid}>
            {rooms.length > 0 ? (
                rooms.map((room, index) => (
                    <RoomCard 
                      key={index}
                      id={room.nama_ruang || room.id} 
                      status="Available" 
                      isDark={isDark} 
                    />
                ))
            ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ThemedText style={{ opacity: 0.5 }}>Memuat data ruangan...</ThemedText>
                </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function RoomCard({ id, status, course, isDark }: any) {
  const statusColor = status === 'Occupied' ? '#1A4FA0' : status === 'Available' ? '#94A3B8' : '#F59E0B';
  
  return (
    <Card style={styles.roomCard}>
      <CardHeader style={styles.roomHeader}>
        <View style={styles.roomTop}>
          <ThemedText style={styles.roomId}>{id}</ThemedText>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <ThemedText style={[styles.statusText, { color: statusColor }]}>{status}</ThemedText>
      </CardHeader>
      {course && (
        <View style={styles.roomFooter}>
          <ThemedText style={styles.courseName} numberOfLines={1}>{course}</ThemedText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', letterSpacing: -1 },
  subtitle: { fontSize: 13, opacity: 0.5, marginTop: 4 },
  roomGrid: { gap: 12 },
  roomCard: { marginBottom: 4 },
  roomHeader: { padding: 16 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomId: { fontSize: 18, fontWeight: 'bold' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  roomFooter: { 
    padding: 16, 
    paddingTop: 0, 
    borderTopWidth: 0, 
    opacity: 0.8 
  },
  courseName: { fontSize: 13, opacity: 0.6 }
});
