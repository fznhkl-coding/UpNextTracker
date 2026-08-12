import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Our Login screen handles access */}
        <Stack.Screen name="login" />
        {/* The main workspace drawer */}
        <Stack.Screen name="(drawer)" options={{ headerShown: false}} />
        <Stack.Screen
          name="modal"
          options={{ 
            presentation: 'modal',
            title: 'New Tracker Entry',
            headerTintColor: '#21963',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#333333',
            }
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
