import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar, TextInput, Image } from 'react-native';
import { storage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { AdminHeader } from '@/components/ui/admin-header';
import { AdminSidebar } from '@/components/ui/admin-sidebar';

export default function EditProfileScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [fullname, setFullname] = React.useState('');
  const [nip, setNip] = React.useState('');
  const [roles, setRoles] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const saved = await storage.getItem('user_data');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setFullname(user.fullname || '');
        setNip(user.name || '');
        setRoles(user.roles || []);
      } catch (e) {
        console.error("Error loading user data", e);
      }
    }
  };

  // Shadcn Light Theme Colors
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    inputBg: '#F8FAFC',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AdminSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
      <AdminHeader 
        title="Detail Profil"
        subtitle="Informasi data pribadi Anda"
        showBack={true}
        onBack={() => router.push('/dashboard-admin/profile')}
        showMenu={true}
        onMenuPress={() => setSidebarVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarLarge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {(fullname || 'AD').substring(0, 2).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <ThemedText style={styles.userName}>{fullname || 'Administrator ITATS'}</ThemedText>
            <ThemedText style={styles.userNip}>{nip ? `NIP: ${nip}` : 'NIP: -'}</ThemedText>
            <View style={styles.roleTag}>
              <ThemedText style={styles.roleText}>{roles[0] || 'Petugas'}</ThemedText>
            </View>
          </View>
        </View>

        {/* Info Cards Section */}
        <View style={styles.infoGroup}>
          <ThemedText style={styles.groupLabel}>DATA IDENTITAS</ThemedText>
          
          <InfoItem 
            icon="person" 
            iconBg="#EFF6FF" 
            iconColor="#2563EB"
            label="Nama Lengkap" 
            value={fullname}
            theme={theme}
          />
          
          <InfoItem 
            icon="id-card" 
            iconBg="#F0FDF4" 
            iconColor="#16A34A"
            label="NIP / Username" 
            value={nip}
            theme={theme}
          />

          <InfoItem 
            icon="briefcase" 
            iconBg="#F5F3FF" 
            iconColor="#7C3AED"
            label="Jabatan / Role" 
            value={roles.join(', ')}
            theme={theme}
          />
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, iconBg, iconColor, label, value, theme }: any) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText style={styles.infoLabel}>{label.toUpperCase()}</ThemedText>
        <ThemedText style={styles.infoValue}>{value || '-'}</ThemedText>
      </View>
    </View>
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
  heroInfo: {
    alignItems: 'center',
  },
  userName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1E293B',
    letterSpacing: -0.5,
    textAlign: 'center'
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
  infoGroup: { 
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
  infoCard: {
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
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: { 
    fontSize: 10, 
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
});
