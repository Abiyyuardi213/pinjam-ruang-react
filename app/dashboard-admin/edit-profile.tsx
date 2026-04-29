import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [image, setImage] = React.useState<string | null>(null);
  
  // Form State
  const [name, setName] = React.useState('Administrator');
  const [email, setEmail] = React.useState('admin@itats.ac.id');
  const [phone, setPhone] = React.useState('081234567890');
  const [nip, setNip] = React.useState('198701012015011001');

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('user_data');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          setName(user.name || 'Administrator');
          setEmail(user.email || 'admin@itats.ac.id');
          setNip(user.nip || '');
        } catch (e) {}
      }
    }
  }, []);

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
    inputBg: '#F9FAFB',
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setLoading(true);
    // Simulasi save
    setTimeout(() => {
      setLoading(false);

      if (Platform.OS === 'web') {
        const saved = localStorage.getItem('user_data');
        let user = saved ? JSON.parse(saved) : {};
        user = { ...user, name, email, nip };
        localStorage.setItem('user_data', JSON.stringify(user));
      }

      Toast.show({
        type: 'success',
        text1: 'Profil Diperbarui',
        text2: 'Perubahan Anda telah berhasil disimpan.',
      });
      router.back();
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard-admin/profile')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Edit Profil</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                  <ThemedText style={styles.avatarPlaceholder}>AD</ThemedText>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.editBadge, { backgroundColor: theme.primary }]}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.avatarHint, { color: theme.mutedText }]}>Tekan ikon kamera untuk mengubah foto</ThemedText>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <InputGroup 
              label="Nama Lengkap" 
              value={name} 
              onChangeText={setName} 
              icon="person-outline" 
              theme={theme} 
            />
            <InputGroup 
              label="NIP / ID Karyawan" 
              value={nip} 
              onChangeText={setNip} 
              icon="id-card-outline" 
              theme={theme} 
              editable={false}
            />
            <InputGroup 
              label="Alamat Email" 
              value={email} 
              onChangeText={setEmail} 
              icon="mail-outline" 
              theme={theme} 
              keyboardType="email-address"
            />
            <InputGroup 
              label="Nomor Telepon" 
              value={phone} 
              onChangeText={setPhone} 
              icon="call-outline" 
              theme={theme} 
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Simpan Perubahan</ThemedText>
            )}
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
      <Toast />
    </View>
  );
}

function InputGroup({ label, value, onChangeText, icon, theme, editable = true, keyboardType = 'default' }: any) {
  return (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.inputLabel, { color: theme.mutedText }]}>{label.toUpperCase()}</ThemedText>
      <View style={[
        styles.inputWrapper, 
        { backgroundColor: theme.inputBg, borderColor: theme.border },
        !editable && { opacity: 0.6 }
      ]}>
        <Ionicons name={icon} size={20} color={theme.mutedText} style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.mutedText}
          editable={editable}
          keyboardType={keyboardType}
        />
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
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarPlaceholder: { color: '#FFF', fontSize: 36, fontWeight: '700' },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarHint: { fontSize: 12, marginTop: 12, fontWeight: '500' },
  form: { gap: 20, marginBottom: 32 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '500',
    // Hilangkan border default pada web
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
