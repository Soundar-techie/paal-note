import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmLogoutModal } from '../../components/common/ConfirmLogoutModal';
import { useAuth } from '../../context/AuthContext';
import { resetLocalDatabase, activityApi, vendorApi, customerApi, buyerApi } from '../../api/client';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState({
    vendors: 0,
    customers: 0,
    buyers: 0,
    activities: 0,
  });

  const loadStats = async () => {
    try {
      const [vRes, cRes, bRes, aRes] = await Promise.all([
        vendorApi.getAll(),
        customerApi.getAll(),
        buyerApi.getAll(),
        activityApi.getAll(),
      ]);
      setStats({
        vendors: vRes.total || vRes.data?.length || 0,
        customers: cRes.total || cRes.data?.length || 0,
        buyers: bRes.total || bRes.data?.length || 0,
        activities: aRes.count || aRes.data?.length || 0,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all milk activity logs, vendor and customer balances back to the initial demo dataset. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetLocalDatabase();
              await loadStats();
              Alert.alert('Reset Complete', 'Local database has been reloaded with fresh demo data!');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to reset data');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile & Settings" subtitle="System Configuration" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badgeWrap}>
                <Badge label={user?.role?.replace('_', ' ') || 'User'} variant="primary" size="sm" />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>User Role</Text>
            <Text style={styles.infoVal}>{user?.role?.toUpperCase()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Phone</Text>
            <Text style={styles.infoVal}>{user?.phone || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Account Status</Text>
            <Text style={[styles.infoVal, { color: Colors.success, fontWeight: '700' }]}>
              {user?.status?.toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Dairy Organization Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="business-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Dairy Organization</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Farm Name</Text>
            <Text style={styles.infoVal}>{user?.organization?.name || 'Orivil Paal Dairy Farm'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Org Code</Text>
            <Text style={styles.infoVal}>{user?.organization?.code || 'ORIVIL01'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Operating Currency</Text>
            <Text style={styles.infoVal}>{user?.organization?.currency || '₹'}</Text>
          </View>
        </Card>

        {/* Database & Data Storage Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="server-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Data Storage & Synchronisation</Text>
          </View>

          <View style={styles.badgeBanner}>
            <View style={styles.greenDot} />
            <Text style={styles.badgeBannerText}>Data Storage Active</Text>
          </View>

          <Text style={styles.storageDesc}>
            Paal-Note manages all daily procurement, distribution, and financial settlement data with offline-first persistence.
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNum}>{stats.vendors}</Text>
              <Text style={styles.statBoxLabel}>Vendors</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNum}>{stats.customers}</Text>
              <Text style={styles.statBoxLabel}>Customers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNum}>{stats.buyers}</Text>
              <Text style={styles.statBoxLabel}>Buyers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNum}>{stats.activities}</Text>
              <Text style={styles.statBoxLabel}>Activities</Text>
            </View>
          </View>

          <Button
            title={resetting ? 'Resetting Data...' : 'Reset to Fresh Demo Dataset'}
            variant="outline"
            size="sm"
            icon="refresh-outline"
            onPress={handleResetData}
            loading={resetting}
            style={{ marginTop: Spacing.md }}
          />
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Paal-Note"
          variant="danger"
          icon="log-out-outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
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
  card: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate50,
  },
  infoKey: {
    fontSize: 13,
    color: Colors.slate500,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate800,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  badgeBannerText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  storageDesc: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  statBoxNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate800,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: Spacing.sm,
  },
});
