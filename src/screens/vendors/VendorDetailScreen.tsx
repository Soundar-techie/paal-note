import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { vendorApi } from '../../api/client';
import { Vendor, DailyActivity, Payment } from '../../types';
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const VendorDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { can } = useAuth();
  const { id } = route.params;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'payments'>('collection');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVendorDetails = useCallback(async () => {
    try {
      const res = await vendorApi.getById(id);
      if (res.success) {
        setVendor(res.data.vendor);
        setStats(res.data.stats);
        setActivities(res.data.activities || []);
        setPayments(res.data.payments || []);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load vendor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchVendorDetails();
    }, [fetchVendorDetails])
  );

  const handleToggleStatus = async () => {
    if (!vendor) return;
    try {
      const res = await vendorApi.toggleStatus(vendor._id);
      if (res.success) {
        setVendor(res.data);
        Alert.alert('Status Updated', `Vendor is now ${res.data.status}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Header title="Vendor Detail" showBack />
        <View style={styles.errorContainer}>
          <Text>Vendor not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={vendor.name}
        subtitle={`${vendor.vendorId} • ${vendor.location}`}
        showBack
        rightAction={
          can('canManageParties')
            ? {
                icon: 'create-outline',
                onPress: () => navigation.navigate('VendorForm', { vendor }),
              }
            : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.profileName}>{vendor.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.slate500} />
                <Text style={styles.locationText}>{vendor.location}</Text>
              </View>
              {vendor.phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color={Colors.slate500} />
                  <Text style={styles.phoneText}>{vendor.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleToggleStatus} disabled={!can('canManageParties')}>
              <Badge
                label={vendor.status}
                variant={vendor.status === 'active' ? 'success' : 'danger'}
                size="md"
              />
            </TouchableOpacity>
          </View>

          {vendor.address ? (
            <Text style={styles.addressText}>
              <Text style={{ fontWeight: '600' }}>Address: </Text>
              {vendor.address}
            </Text>
          ) : null}

          {/* Quick Info Grid */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Default Milk</Text>
              <Text style={styles.quickInfoVal}>{vendor.defaultMilkType}</Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Agreed Rate</Text>
              <Text style={styles.quickInfoVal}>₹{vendor.defaultRate}/L</Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Advance Balance</Text>
              <Text style={styles.quickInfoVal}>{formatCurrency(vendor.advanceBalance || 0)}</Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Payment Frequency</Text>
              <Text style={[styles.quickInfoVal, { textTransform: 'capitalize' }]}>
                {vendor.paymentFrequency || 'weekly'}
              </Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Payout Cycle</Text>
              <Text style={styles.quickInfoVal}>
                {vendor.paymentFrequency === 'daily'
                  ? 'Daily'
                  : vendor.paymentFrequency === 'monthly'
                  ? `Every ${vendor.payoutCycleDate || 1}th`
                  : `Every ${vendor.payoutCycleDay || 'Sunday'}`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Financial Summary Banner */}
        <Card style={styles.financialBanner}>
          <Text style={styles.financialBannerTitle}>Financial Balance Sheet</Text>
          <View style={styles.financialNumbersRow}>
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Payable</Text>
              <Text style={styles.finVal}>{formatCurrency(vendor.totalPayable)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Paid</Text>
              <Text style={[styles.finVal, { color: Colors.primary }]}>
                {formatCurrency(vendor.totalPaid)}
              </Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Outstanding Balance</Text>
              <Text
                style={[
                  styles.finVal,
                  { color: vendor.balance > 0 ? Colors.danger : Colors.success },
                ]}
              >
                {formatCurrency(vendor.balance)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {can('canRecordPayments') && (
              <Button
                title="Pay Vendor"
                icon="cash-outline"
                variant="primary"
                size="sm"
                style={{ flex: 1, marginRight: 6 }}
                onPress={() =>
                  navigation.navigate('RecordPayment', {
                    partyType: 'vendor',
                    partyId: vendor._id,
                  })
                }
              />
            )}
            <Button
              title="Add Milk Entry"
              icon="add-circle-outline"
              variant="secondary"
              size="sm"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() =>
                navigation.navigate('AddActivity', {
                  defaultType: 'collection',
                  partyType: 'vendor',
                  partyId: vendor._id,
                })
              }
            />
          </View>
        </Card>

        {/* History Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'collection' && styles.tabBtnActive]}
            onPress={() => setActiveTab('collection')}
          >
            <Text
              style={[styles.tabBtnText, activeTab === 'collection' && styles.tabBtnTextActive]}
            >
              Milk Collection ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}
            >
              Payouts ({payments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Collection History */}
        {activeTab === 'collection' && (
          <View>
            {activities.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No milk collection records found for this vendor.</Text>
              </Card>
            ) : (
              activities.map((act) => (
                <View key={act._id} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(act.date)}</Text>
                    <View style={styles.historySubRow}>
                      <Badge label={act.session} variant={act.session} size="sm" />
                      <Text style={styles.historyMilkType}> • {act.milkType}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyQty}>{formatLitres(act.quantityLitres)}</Text>
                    <Text style={styles.historyAmount}>
                      @ ₹{act.ratePerLitre} = {formatCurrency(act.totalAmount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Payment History */}
        {activeTab === 'payments' && (
          <View>
            {payments.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No payment transactions recorded yet.</Text>
              </Card>
            ) : (
              payments.map((p) => (
                <View key={p._id} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(p.date)}</Text>
                    <Text style={styles.paymentNum}>
                      {p.paymentNumber} • {p.paymentMode}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyQty, { color: Colors.danger }]}>
                      - {formatCurrency(p.amount)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Receipt', { id: p._id })}
                    >
                      <Text style={styles.receiptLink}>View Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  locationText: {
    fontSize: 13,
    color: Colors.slate600,
    marginLeft: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  phoneText: {
    fontSize: 13,
    color: Colors.slate600,
    marginLeft: 4,
  },
  addressText: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 8,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  quickInfoBox: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate400,
    textTransform: 'uppercase',
  },
  quickInfoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 2,
  },
  financialBanner: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  financialBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: Spacing.sm,
  },
  financialNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  financialCol: {
    alignItems: 'center',
    flex: 1,
  },
  finDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.slate200,
  },
  finLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  finVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyNote: {
    textAlign: 'center',
    color: Colors.slate500,
    fontSize: 13,
    paddingVertical: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  historySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyMilkType: {
    fontSize: 11,
    color: Colors.slate500,
  },
  paymentNum: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 3,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  historyAmount: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  receiptLink: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
});
