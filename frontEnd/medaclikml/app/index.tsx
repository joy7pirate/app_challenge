import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const storedRole = await AsyncStorage.getItem('role');
        setIsAuthenticated(!!token);
        setRole(storedRole);
      } catch (error) {
        setIsAuthenticated(false);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/LoginScreen" />;
  }

  return role === 'medecin'
    ? <Redirect href="/medecinPages/dashboardDoc1" />
    : <Redirect href="/(tabs)" />;
}
