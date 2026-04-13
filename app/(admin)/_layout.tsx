import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  // Supabase/Shadcn Colors
  const colors = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#EDEDED' : '#11181C',
    tabBar: isDark ? '#1C1C1C' : '#FFFFFF',
    border: isDark ? '#2E2E2E' : '#E2E8F0',
    primary: '#1A4FA0', // Blue
    inactive: isDark ? '#888888' : '#64748B',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hapus navbar top sesuai rikwes
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 + insets.bottom : 68 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: Platform.select({ ios: 'Inter', android: 'Inter', default: 'System' }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "qr-code" : "qr-code-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Pantau',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
