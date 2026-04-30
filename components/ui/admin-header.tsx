import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
}

export function AdminHeader({ 
  title, 
  subtitle, 
  showBack, 
  onBack, 
  rightIcon, 
  onRightPress,
  showMenu,
  onMenuPress
}: AdminHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerRow}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity 
              onPress={onBack || (() => router.back())} 
              style={styles.iconBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          <View style={showBack ? { marginLeft: 12 } : {}}>
            <ThemedText style={styles.titleText}>{title}</ThemedText>
            {subtitle && <ThemedText style={styles.subtitleText}>{subtitle}</ThemedText>}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
              <Ionicons name={rightIcon} size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          {showMenu && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
              <Ionicons name="grid-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1E293B', // Slate 900
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
});
