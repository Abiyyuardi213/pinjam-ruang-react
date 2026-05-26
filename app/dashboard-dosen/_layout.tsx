import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { BottomBar } from '@/components/ui/BottomBar';
import { storage } from '@/utils/storage';

export default function DosenLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userData = await storage.getItem('user_data');
      if (!userData) {
        setIsAuthenticated(false);
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090D16' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

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
