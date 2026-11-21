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

interface MenuItem {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgLight: string;
  screen?: string;
  action?: () => void;
  requiredRole?: ('super_admin' | 'admin' | 'employee')[];
  requiredPermission?: 'canEditActivities' | 'canRecordPayments' | 'canManageParties' | 'canViewReports';
}

export const MenuScreen: React.FC = () => {
  const { user, logout, hasRole, can } = useAuth();
  const navigation = useNavigation<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems: MenuItem[] = [
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
      subtitle: 'Staff & admin accounts',
      icon: 'person-add',
      color: '#F97316',
      bgLight: '#FFEDD5',
      screen: 'UserList',
      requiredRole: ['super_admin', 'admin'],
    },
    {
      title: 'Profile & Settings',
      subtitle: 'Farm info & API config',
      icon: 'settings',
      color: Colors.slate700,
      bgLight: Colors.slate100,
      screen: 'Profile',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const visibleItems = menuItems.filter((item) => {
    if (item.requiredRole && !hasRole(...item.requiredRole)) {
      return false;
    }
    if (item.requiredPermission && !can(item.requiredPermission)) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Main Navigation"
        subtitle={`${user?.organization?.name || 'Dairy Modules'}`}
        roleBadge={user?.role}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Mini Banner */}
        <View style={styles.userBanner}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRoleText}>
              {user?.role?.toUpperCase().replace('_', ' ')} • {user?.organization?.code}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>System Modules ({visibleItems.length})</Text>

        {/* Modules Grid */}
        <View style={styles.grid}>
          {visibleItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.gridCard}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgLight }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoutText}>Log Out</Text>
            <Text style={styles.logoutSub}>Sign out of your account on this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.slate400} />
        </TouchableOpacity>
      </ScrollView>

      {/* Same-screen In-App Confirmation Pop-Up */}
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
  userBanner: {
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
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
  },
  userRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    margin: '1%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
    lineHeight: 15,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  logoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  logoutSub: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 1,
  },
});
