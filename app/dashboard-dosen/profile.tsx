import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Modal, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function ProfileDosen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userData, setUserData] = React.useState<any>(null);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const saved = await storage.getItem('user_data');
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch (e) {}
    }
  };

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
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <ThemedText style={styles.title}>Profil Saya</ThemedText>
        <ThemedText style={styles.subtitle}>Kelola informasi akun dan preferensi</ThemedText>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {(userData?.fullname || userData?.name || 'D').substring(0, 1).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.userName}>{userData?.fullname || userData?.name || 'Dosen ITATS'}</ThemedText>
          <ThemedText style={styles.userNip}>{userData?.nip || 'NIP: 0725048901'}</ThemedText>
          <View style={styles.roleTag}>
             <ThemedText style={styles.roleText}>DOSEN TETAP</ThemedText>
          </View>
        </View>

        <View style={styles.sectionLabelContainer}>
           <ThemedText style={styles.sectionLabel}>PENGATURAN</ThemedText>
        </View>

        <View style={styles.menuSection}>
          <MenuItem 
            icon="settings-outline" 
            label="Pengaturan Akun" 
            desc="Atur keamanan dan data pribadi"
          />
          <MenuItem 
            icon="help-circle-outline" 
            label="Bantuan" 
            desc="Pusat informasi dan panduan"
          />
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={() => setLogoutModalVisible(true)}
          >
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.menuLabel, { color: '#EF4444' }]}>Keluar Sesi</ThemedText>
              <ThemedText style={styles.menuDesc}>Akhiri penggunaan di perangkat ini</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
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
                onPress={() => setLogoutModalVisible(false)}
              >
                <ThemedText style={styles.cancelBtnText}>Batal</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={handleLogout}
              >
                <ThemedText style={styles.confirmBtnText}>Ya, Keluar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({ icon, label, desc }: any) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color="#1E293B" />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
        <ThemedText style={styles.menuDesc}>{desc}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
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
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  userNip: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  roleTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 12,
  },
  roleText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionLabelContainer: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  menuSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  logoutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
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
    borderRadius: 16,
    alignItems: 'center',
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
