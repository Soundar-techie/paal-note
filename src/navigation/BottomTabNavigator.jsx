import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { DailyActivityScreen } from '../screens/activity/DailyActivityScreen';
import { VendorListScreen } from '../screens/vendors/VendorListScreen';
import { CustomerListScreen } from '../screens/customers/CustomerListScreen';
import { MenuScreen } from '../screens/menu/MenuScreen';

const Tab = createBottomTabNavigator();

const TabIconItem = ({
  focused,
  activeIcon,
  inactiveIcon,
  isSmallMobile,
  isMediumMobile,
}) => {
  const pillWidth = isSmallMobile ? 42 : isMediumMobile ? 48 : 52;
  const pillHeight = isSmallMobile ? 26 : 28;
  const iconSize = isSmallMobile ? 18 : 20;

  return (
    <View
      style={[
        styles.iconPill,
        {
          width: pillWidth,
          height: pillHeight,
          backgroundColor: focused ? Colors.primaryLight : 'transparent',
        },
      ]}
    >
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={iconSize}
        color={focused ? Colors.primaryDark : Colors.slate400}
      />
    </View>
  );
};

export const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallMobile = width <= 385;
  const isMediumMobile = width > 385 && width < 480;

  // Responsive height calculation
  const tabHeight =
    Platform.OS === 'web'
      ? isSmallMobile
        ? 60
        : 64
      : (isSmallMobile ? 54 : 58) + insets.bottom;

  const tabPaddingBottom =
    Platform.OS === 'web'
      ? isSmallMobile
        ? 4
        : 6
      : Math.max(insets.bottom, isSmallMobile ? 4 : 6);

  const labelFontSize = isSmallMobile ? 9.5 : 10.5;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.slate500,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: 4,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: labelFontSize,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: -0.1,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                { fontSize: labelFontSize, color },
                focused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              Dashboard
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              activeIcon="grid"
              inactiveIcon="grid-outline"
              isSmallMobile={isSmallMobile}
              isMediumMobile={isMediumMobile}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Daily Activity"
        component={DailyActivityScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                { fontSize: labelFontSize, color },
                focused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              Daily Milk
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              activeIcon="water"
              inactiveIcon="water-outline"
              isSmallMobile={isSmallMobile}
              isMediumMobile={isMediumMobile}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Vendors"
        component={VendorListScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                { fontSize: labelFontSize, color },
                focused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              Vendors
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              activeIcon="people"
              inactiveIcon="people-outline"
              isSmallMobile={isSmallMobile}
              isMediumMobile={isMediumMobile}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Customers"
        component={CustomerListScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                { fontSize: labelFontSize, color },
                focused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              Customers
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              activeIcon="home"
              inactiveIcon="home-outline"
              isSmallMobile={isSmallMobile}
              isMediumMobile={isMediumMobile}
            />
          ),
        }}
      />

      <Tab.Screen
        name="More"
        component={MenuScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                { fontSize: labelFontSize, color },
                focused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              Menu
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              activeIcon="apps"
              inactiveIcon="apps-outline"
              isSmallMobile={isSmallMobile}
              isMediumMobile={isMediumMobile}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconPill: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  tabLabel: {
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
