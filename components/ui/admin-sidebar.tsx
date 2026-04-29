import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Animated, Dimensions, Pressable, Platform } from 'react-native';
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
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (isVisible && Platform.OS === 'web') {
      const saved = localStorage.getItem('user_data');
      if (saved) {
        try {
          setUserData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [isVisible]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('user_data');
      router.replace('/login');
    }
  };

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
        {/* Profile Header Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
               <ThemedText style={styles.avatarText}>
                 {(userData?.name || 'A').substring(0, 1).toUpperCase()}
               </ThemedText>
            </View>
            <View style={styles.userDetails}>
               <ThemedText style={styles.userName}>{userData?.name || 'Administrator'}</ThemedText>
               <ThemedText style={styles.userNip}>{userData?.nip || 'NIP: 4124022001'}</ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionLabelContainer}>
           <ThemedText style={styles.sectionLabel}>MENU UTAMA</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SidebarItem 
            icon="grid-outline" 
            label="Dashboard" 
            onPress={() => { onClose(); router.push('/dashboard-admin'); }}
          />
          <SidebarItem 
            icon="business-outline" 
            label="Data Ruangan" 
            onPress={() => { onClose(); router.push('/dashboard-admin/rooms'); }}
          />
          <SidebarItem 
            icon="calendar-outline" 
            label="Peminjaman" 
            onPress={() => { onClose(); router.push('/dashboard-admin/peminjaman'); }}
          />
          <SidebarItem 
            icon="qr-code-outline" 
            label="Validasi QR" 
            onPress={() => { onClose(); router.push('/dashboard-admin/scan'); }}
          />
          <SidebarItem 
            icon="map-outline" 
            label="Mapping Ruang" 
            onPress={() => { onClose(); router.push('/dashboard-admin/mapping'); }}
          />

          <View style={styles.divider} />
          
          <View style={styles.sectionLabelContainer}>
             <ThemedText style={styles.sectionLabel}>LAINNYA</ThemedText>
          </View>

          <SidebarItem icon="settings-outline" label="Pengaturan" />
          <SidebarItem icon="help-circle-outline" label="Bantuan" />
        </ScrollView>

        {/* Logout Section */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
             <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
             <ThemedText style={styles.logoutText}>Logout Sesi</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.versionText}>ITATS Mobile v1.0.2</ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

function SidebarItem({ icon, label, onPress }: { icon: any, label: string, onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.6} style={styles.item} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#94A3B8" />
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#0F172A', // Slate 900
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userNip: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  closeBtn: {
    padding: 8,
  },
  sectionLabelContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 8,
    fontWeight: '600',
  },
});
