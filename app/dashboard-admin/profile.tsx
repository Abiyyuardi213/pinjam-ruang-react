import React from 'react';
import { storage } from '@/utils/storage';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminHeader } from '@/components/ui/admin-header';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import Toast from 'react-native-toast-message';

export default function AdminProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [userData, setUserData] = React.useState<any>(null);
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  
  // Force Light Theme
  const isDark = false;

  React.useEffect(() => {
    const loadUser = async () => {
      const savedUser = await storage.getItem('user_data');
      if (savedUser) {
        try {
          setUserData(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
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

  // Shadcn Light Theme Colors
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    danger: '#EF4444',
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
        
        <AdminHeader 
          title="Profil Saya"
          subtitle="Kelola informasi akun dan preferensi"
          showBack={false}
          showMenu={true}
          onMenuPress={() => setSidebarVisible(true)}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarLarge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.avatarText}>
                  {(userData?.fullname || userData?.name || 'AD').substring(0, 2).toUpperCase()}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroInfo}>
              <ThemedText style={styles.userName}>{userData?.fullname || userData?.name || 'Administrator ITATS'}</ThemedText>
              <ThemedText style={styles.userNip}>{userData?.name ? `NIP: ${userData.name}` : 'NIP: -'}</ThemedText>
              <View style={styles.roleTag}>
                <ThemedText style={styles.roleText}>{userData?.roles?.[0] || 'Petugas'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Account Settings Section */}
          <View style={styles.menuGroup}>
            <ThemedText style={styles.groupLabel}>PENGATURAN AKUN</ThemedText>
            
            <MenuItem 
              icon="person" 
              iconBg="#EFF6FF" 
              iconColor="#2563EB"
              label="Data Pribadi" 
              desc="Nama, NIP, dan informasi kontak"
              onPress={() => router.push('/dashboard-admin/edit-profile')}
            />
            
            <MenuItem 
              icon="shield-checkmark" 
              iconBg="#F0FDF4" 
              iconColor="#16A34A"
              label="Keamanan" 
              desc="Ganti kata sandi dan autentikasi"
              onPress={() => router.push('/dashboard-admin/security')}
            />

            <MenuItem 
              icon="notifications" 
              iconBg="#FFF7ED" 
              iconColor="#EA580C"
              label="Notifikasi" 
              desc="Atur pemberitahuan peminjaman"
            />
          </View>

          {/* General Section */}
          <View style={styles.menuGroup}>
            <ThemedText style={styles.groupLabel}>UMUM</ThemedText>
            
            <MenuItem 
              icon="help-circle" 
              iconBg="#F5F3FF" 
              iconColor="#7C3AED"
              label="Pusat Bantuan" 
              desc="Butuh panduan penggunaan?"
              onPress={() => router.push('/dashboard-admin/help')}
            />
            
            <MenuItem 
              icon="information-circle" 
              iconBg="#F1F5F9" 
              iconColor="#475569"
              label="Tentang Aplikasi" 
              desc="Informasi versi dan pengembang"
              onPress={() => router.push('/dashboard-admin/about')}
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.logoutBtn}
              onPress={() => setLogoutModalVisible(true)}
            >
              <View style={styles.logoutIconBox}>
                <Ionicons name="log-out" size={20} color={theme.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.logoutTitle}>Keluar Sesi</ThemedText>
                <ThemedText style={styles.logoutDesc}>Akhiri penggunaan di perangkat ini</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Safe Bottom Padding */}
          <View style={{ height: 180 }} />
        </ScrollView>

        {/* Logout Confirmation Modal */}
        <LogoutModal 
          visible={logoutModalVisible}
          onClose={() => setLogoutModalVisible(false)}
          onConfirm={handleLogout}
        />
    </View>
  );
}

function LogoutModal({ visible, onClose, onConfirm }: any) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIconBox}>
            <Ionicons name="log-out" size={32} color="#EF4444" />
          </View>
          
          <ThemedText style={styles.modalTitle}>Keluar Sesi?</ThemedText>
          <ThemedText style={styles.modalDesc}>
            Anda harus memasukkan kembali NIP dan kata sandi untuk masuk ke aplikasi.
          </ThemedText>
          
          <View style={styles.modalActionRow}>
            <TouchableOpacity 
              style={[styles.modalBtn, styles.cancelBtn]} 
              onPress={onClose}
            >
              <ThemedText style={styles.cancelBtnText}>Batal</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalBtn, styles.confirmBtn]} 
              onPress={onConfirm}
            >
              <ThemedText style={styles.confirmBtnText}>Ya, Keluar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, iconBg, iconColor, label, desc, onPress }: any) {
  return (
    <TouchableOpacity 
        activeOpacity={0.6}
        style={styles.menuCard}
        onPress={onPress}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
        <ThemedText style={styles.menuDesc}>{desc}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
      paddingTop: 24, 
  },
  heroSection: { 
    alignItems: 'center', 
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarLarge: { 
    width: 100, 
    height: 100, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  avatarText: { 
    fontSize: 36, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    alignItems: 'center',
  },
  userName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1E293B',
    letterSpacing: -0.5 
  },
  userNip: { 
    fontSize: 14, 
    color: '#64748B',
    fontWeight: '700',
    marginTop: 4 
  },
  roleTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
  },
  roleText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  menuGroup: { 
    paddingHorizontal: 24,
    marginBottom: 24 
  },
  groupLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#94A3B8',
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: 1 
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: { 
    fontSize: 15, 
    fontWeight: '700',
    color: '#1E293B',
  },
  menuDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  logoutDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  confirmBtn: {
    backgroundColor: '#EF4444',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
