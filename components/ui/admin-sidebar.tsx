import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isVisible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  return (
    <View 
      style={[
        styles.absoluteContainer, 
        { pointerEvents: isVisible ? 'auto' : 'none' }
      ]}
    >
      {/* Overlay - Only visible when menu is shown */}
      {isVisible && (
        <Pressable 
          style={styles.overlay} 
          onPress={onClose} 
        />
      )}

      {/* Sidebar Content */}
      <Animated.View 
        style={[
          styles.container, 
          { 
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>Menu Tambahan</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SidebarItem 
            icon="business-outline" 
            label="Data Ruangan" 
            onPress={() => {
                onClose();
                router.push('/dashboard-admin/rooms');
            }}
          />
          <SidebarItem 
            icon="book-outline" 
            label="Mata Kuliah" 
            onPress={() => {
                onClose();
                router.push('/dashboard-admin/subjects');
            }}
          />
          <SidebarItem 
            icon="calendar-outline" 
            label="Peminjaman Ruang" 
            onPress={() => {
                onClose();
                router.push('/dashboard-admin/peminjaman');
            }}
          />
          <SidebarItem icon="key-outline" label="Pemantauan Kunci" />
          <SidebarItem 
            icon="map-outline" 
            label="Mapping Ruang" 
            onPress={() => {
                onClose();
                router.push('/dashboard-admin/mapping');
            }}
          />

          <SidebarItem icon="people-outline" label="Dosen Pengganti" />
          <SidebarItem icon="document-text-outline" label="Ijin Kuliah" />
          
          <View style={styles.divider} />
          
          <SidebarItem icon="settings-outline" label="Pengaturan Sistem" />
          <SidebarItem icon="help-circle-outline" label="Pusat Bantuan" />
        </ScrollView>

        <View style={styles.footer}>
          <ThemedText style={styles.versionText}>v1.0.2 Beta</ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

function SidebarItem({ icon, label, onPress }: { icon: any, label: string, onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color="#1A4FA0" />
      </View>
      <ThemedText style={styles.itemLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A4FA0',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1A4FA010',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 'auto',
  },
  versionText: {
    fontSize: 12,
    opacity: 0.3,
  },
});
