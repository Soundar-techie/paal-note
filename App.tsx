import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ResponsiveMobileWrapper } from './src/components/common/ResponsiveMobileWrapper';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ResponsiveMobileWrapper>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </ResponsiveMobileWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
