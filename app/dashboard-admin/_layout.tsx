import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { BottomBar } from '@/components/ui/BottomBar';

export default function AdminLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false, 
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="monitor" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen
        name="rooms"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="peminjaman/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="peminjaman/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mapping"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="room-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subject-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
