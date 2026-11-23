import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { ConfirmLogoutModal } from '../../components/common/ConfirmLogoutModal';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const MenuScreen = () => {
  const { user, logout, hasRole, can } = useAuth();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    {
      title: 'Daily Activity',
      subtitle: 'Morning & evening milk entry',
      icon: 'water',
      color: Colors.primary,
      bgLight: Colors.primaryLight,
      screen: 'Daily Activity',
    },
    {
      title: 'Vendors',
      subtitle: 'Milk suppliers & payouts',
      icon: 'people',
      color: Colors.primary,
      bgLight: Colors.primaryLight,
      screen: 'Vendors',
    },
    {
      title: 'Customers',
      subtitle: 'Households & delivery quotas',
      icon: 'home',
      color: Colors.secondary,
      bgLight: Colors.secondaryLight,
      screen: 'Customers',
    },
    {
      title: 'Bulk Buyers',
      subtitle: 'Commercial & bakery sales',
      icon: 'business',
      color: Colors.accent,
      bgLight: Colors.accentLight,
      screen: 'Buyers',
    },
    {
      title: 'Payments & Receipts',
      subtitle: 'Cash, UPI & Bank settlements',
      icon: 'cash',
      color: Colors.success,
      bgLight: Colors.successLight,
      screen: 'PaymentList',
    },
    {
      title: 'Reports & Analytics',
      subtitle: 'Daily, weekly & CSV exports',
      icon: 'bar-chart',
      color: '#8B5CF6',
      bgLight: '#EDE9FE',
      screen: 'Reports',
      requiredPermission: 'canViewReports',
    },
    {
      title: 'Master Settings',
      subtitle: 'Locations, rates & units',
      icon: 'options',
      color: '#EC4899',
      bgLight: '#FCE7F3',
      screen: 'Masters',
      requiredRole: ['super_admin', 'admin'],
    },
    {
      title: 'Activity Log',
      subtitle: 'Security & audit trail',
      icon: 'shield-checkmark',
      color: '#0EA5E9',
      bgLight: '#E0F2FE',
      screen: 'ActivityLog',
      requiredRole: ['super_admin', 'admin'],
    },
    {
      title: 'User Management',
      subtitle: 'Staff accounts & permissions',
      icon: 'person-add',
      color: '#F59E0B',
      bgLight: '#FEF3C7',
      screen: 'UserList',
      requiredRole: ['super_admin'],
    },
    {
      title: 'Profile & Organization',
      subtitle: 'Dairy farm setup & settings',
      icon: 'settings-outline',
      color: Colors.slate700,
      bgLight: Colors.slate100,
      screen: 'Profile',
    },
    {
      title: 'Sign Out',
      subtitle: 'End current session',
      icon: 'log-out-outline',
      color: Colors.danger,
      bgLight: Colors.dangerLight,
      action: () => setShowLogoutModal(true),
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.requiredRole && !hasRole(...item.requiredRole)) return false;
    if (item.requiredPermission && !can(item.requiredPermission)) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Modules & Hub"
        subtitle={`System Access (${user?.role?.toUpperCase()})`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Status Strip */}
        <View style={styles.userStrip}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userStripInfo}>
            <Text style={styles.userStripName}>{user?.name}</Text>
            <Text style={styles.userStripEmail}>{user?.email}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>System Operations</Text>

        {/* Modules Grid */}
        <View style={styles.grid}>
          {filteredMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.screen) {
                  navigation.navigate(item.screen);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgLight }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.slate400} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Paal-Note v1.0 • Orivil Dairy Farm Platform
        </Text>
      </ScrollView>

      {/* Confirmation Pop-Up */}
      <ConfirmLogoutModal
        visible={showLogoutModal}
        userName={user?.name}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  userStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userStripInfo: {
    flex: 1,
  },
  userStripName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  userStripEmail: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'column',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  footerNote: {
    textAlign: 'center',
    color: Colors.slate400,
    fontSize: 11,
    marginTop: Spacing.xl,
  },
});
