import { Redirect } from 'expo-router';

export default function Index() {
  // Secara default, arahkan ke halaman login
  return <Redirect href="/login" />;
}
