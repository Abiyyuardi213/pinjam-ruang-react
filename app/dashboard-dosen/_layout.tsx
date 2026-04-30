import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { BottomBar } from '@/components/ui/BottomBar';

export default function DosenLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false, 
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="jadwal" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
