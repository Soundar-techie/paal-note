import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

// Auth Screen
import { LoginScreen } from '../screens/auth/LoginScreen';

// Main Tabs
import { BottomTabNavigator } from './BottomTabNavigator';

// Detail & Action Screens
import { VendorDetailScreen } from '../screens/vendors/VendorDetailScreen';
import { VendorFormScreen } from '../screens/vendors/VendorFormScreen';
import { CustomerDetailScreen } from '../screens/customers/CustomerDetailScreen';
import { CustomerFormScreen } from '../screens/customers/CustomerFormScreen';
import { BuyerListScreen } from '../screens/buyers/BuyerListScreen';
import { BuyerDetailScreen } from '../screens/buyers/BuyerDetailScreen';
import { BuyerFormScreen } from '../screens/buyers/BuyerFormScreen';
import { AddActivityScreen } from '../screens/activity/AddActivityScreen';
import { ActivityDetailScreen } from '../screens/activity/ActivityDetailScreen';
import { PaymentListScreen } from '../screens/payments/PaymentListScreen';
import { RecordPaymentScreen } from '../screens/payments/RecordPaymentScreen';
import { ReceiptScreen } from '../screens/payments/ReceiptScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { MastersScreen } from '../screens/masters/MastersScreen';
import { ActivityLogScreen } from '../screens/logs/ActivityLogScreen';
import { UserListScreen } from '../screens/users/UserListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!token ? (
        // Auth Stack
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        // App Stack
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

          {/* Vendors */}
          <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
          <Stack.Screen name="VendorForm" component={VendorFormScreen} />

          {/* Customers */}
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />

          {/* Buyers */}
          <Stack.Screen name="Buyers" component={BuyerListScreen} />
          <Stack.Screen name="BuyerDetail" component={BuyerDetailScreen} />
          <Stack.Screen name="BuyerForm" component={BuyerFormScreen} />

          {/* Activities */}
          <Stack.Screen name="AddActivity" component={AddActivityScreen} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />

          {/* Payments */}
          <Stack.Screen name="PaymentList" component={PaymentListScreen} />
          <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} />

          {/* Reports */}
          <Stack.Screen name="Reports" component={ReportsScreen} />

          {/* Masters */}
          <Stack.Screen name="Masters" component={MastersScreen} />

          {/* Logs */}
          <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />

          {/* User Management */}
          <Stack.Screen name="UserList" component={UserListScreen} />

          {/* Profile & Settings */}
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
