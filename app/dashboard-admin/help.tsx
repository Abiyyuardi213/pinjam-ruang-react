import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  // Force Light Theme
  const theme = {
    bg: '#FAFAFA',
    text: '#09090B',
    mutedText: '#71717A',
    border: '#E4E4E7',
    primary: '#2563EB',
    cardBg: '#FFFFFF',
  };

  const faqs = [
    {
      q: 'Bagaimana cara meminjam ruangan?',
      a: 'Anda dapat meminjam ruangan melalui menu QR/Scan di bottom bar, lalu pilih ruangan dan isi formulir peminjaman.'
    },
    {
      q: 'Berapa lama waktu maksimal peminjaman?',
      a: 'Waktu peminjaman maksimal adalah sesuai dengan jam operasional kampus atau sesuai persetujuan admin laboratorium.'
    },
    {
      q: 'Bagaimana jika kunci ruangan tidak ada?',
      a: 'Silakan hubungi petugas laboratorium atau bagian sarana prasarana di gedung terkait.'
    },
    {
      q: 'Apakah saya bisa membatalkan peminjaman?',
      a: 'Ya, Anda dapat membatalkan peminjaman melalui riwayat peminjaman sebelum waktu mulai tercapai.'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/dashboard-admin/profile')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Bantuan</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Pertanyaan Sering Diajukan (FAQ)</ThemedText>
          
          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <View key={index} style={[styles.faqCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <ThemedText style={[styles.faqQuestion, { color: theme.primary }]}>{faq.q}</ThemedText>
                <ThemedText style={[styles.faqAnswer, { color: theme.mutedText }]}>{faq.a}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Hubungi Kami</ThemedText>
          <View style={[styles.contactCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <ContactItem icon="mail-outline" label="Email Support" value="support@itats.ac.id" theme={theme} />
            <ContactItem icon="call-outline" label="Hotline Sarpras" value="+62 31 1234567" theme={theme} last />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ContactItem({ icon, label, value, theme, last }: any) {
  return (
    <View style={[styles.contactItem, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={24} color={theme.primary} />
      <View>
        <ThemedText style={[styles.contactLabel, { color: theme.mutedText }]}>{label}</ThemedText>
        <ThemedText style={[styles.contactValue, { color: theme.text }]}>{value}</ThemedText>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  faqList: { gap: 12 },
  faqCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  faqQuestion: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  faqAnswer: { fontSize: 13, lineHeight: 20 },
  contactCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  contactLabel: { fontSize: 12, fontWeight: '500' },
  contactValue: { fontSize: 15, fontWeight: '700' },
});
