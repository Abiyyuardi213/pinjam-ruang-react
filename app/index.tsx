import React from 'react';
import { useRouter } from 'expo-router';
import { storage } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await storage.getItem("user_data");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.name?.startsWith("CSR") || user.role === "admin" || user.nip === "522002240020") {
            router.replace("/dashboard-admin");
          } else {
            router.replace("/dashboard-dosen");
          }
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error("Error checking auth in index:", e);
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

