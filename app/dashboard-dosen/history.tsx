import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryDosen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <ThemedText style={styles.title}>Riwayat Presensi</ThemedText>
        <ThemedText style={styles.subtitle}>Log kehadiran Anda di ruangan</ThemedText>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#CBD5E1" />
          <ThemedText style={styles.emptyText}>Halaman Riwayat dalam pengembangan</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#09090B',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    marginTop: 4,
  },
  content: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
});
