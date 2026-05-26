import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Pattern,
  Rect,
  Path
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

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
    <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
      {/* Dynamic Cyberpunk Background Motif */}
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          {/* Subtle Tech Dot Grid */}
          <Pattern id="cyberHeaderDotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1.2" fill="#FFF" opacity="0.08" />
          </Pattern>
          
          {/* Blue Radial Glow - Top Right */}
          <RadialGradient id="cyberGlowBlue" cx="95%" cy="10%" rx="60%" ry="60%" fx="95%" fy="10%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
            <Stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </RadialGradient>
          
          {/* Violet Radial Glow - Bottom Left */}
          <RadialGradient id="cyberGlowViolet" cx="10%" cy="90%" rx="55%" ry="55%" fx="10%" fy="90%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        {/* Sleek Deep Slate-950 Base */}
        <Rect width="100%" height="100%" fill="#090D16" />
        
        {/* Glow Overlays */}
        <Rect width="100%" height="100%" fill="url(#cyberGlowBlue)" />
        <Rect width="100%" height="100%" fill="url(#cyberGlowViolet)" />
        
        {/* Grid pattern overlay */}
        <Rect width="100%" height="100%" fill="url(#cyberHeaderDotGrid)" />
        
        {/* Technical Vector Graphics */}
        {/* Top-Right Rings */}
        <Circle cx="95%" cy="10%" r="50" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.15" />
        <Circle cx="95%" cy="10%" r="85" stroke="#8B5CF6" strokeWidth="1.2" fill="none" opacity="0.09" strokeDasharray="4 4" />
        <Circle cx="95%" cy="10%" r="120" stroke="#06B6D4" strokeWidth="0.8" fill="none" opacity="0.05" />

        {/* Bottom-Left Rings */}
        <Circle cx="5%" cy="90%" r="65" stroke="#8B5CF6" strokeWidth="1" fill="none" opacity="0.1" strokeDasharray="3 6" />

        {/* Wave Vector Paths */}
        <Path 
          d="M-20,40 Q100,80 220,10 T460,-10" 
          stroke="rgba(6, 182, 212, 0.15)" 
          strokeWidth="1.5" 
          fill="none" 
        />
        <Path 
          d="M-40,90 Q120,30 280,70 T600,20" 
          stroke="rgba(139, 92, 246, 0.12)" 
          strokeWidth="1" 
          fill="none" 
          strokeDasharray="5 5"
        />
      </Svg>

      <View style={styles.headerRow}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onBack || (() => router.back())} 
              style={styles.iconBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          <View style={[styles.textWrapper, showBack ? { marginLeft: 16 } : {}]}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.titleText}>{title}</ThemedText>
              <View style={styles.pulseIndicator}>
                <View style={styles.pulseDot} />
                <View style={styles.pulseRing} />
              </View>
            </View>
            {subtitle && <ThemedText style={styles.subtitleText}>{subtitle}</ThemedText>}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightIcon && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onRightPress} 
              style={styles.iconBtn}
            >
              <Ionicons name={rightIcon} size={18} color="#FFF" />
            </TouchableOpacity>
          )}
          {showMenu && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onMenuPress} 
              style={styles.iconBtn}
            >
              <Ionicons name="grid-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cyberpunk Bottom Accent Glow Border */}
      <LinearGradient
        colors={['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomBorderLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#090D16',
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // green pulse dot
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        // Safe casting to allow web-only CSS properties
        ...({
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        } as any)
      }
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  bottomBorderLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
