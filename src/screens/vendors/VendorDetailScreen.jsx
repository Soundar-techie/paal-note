import React, { useState, useCallback } from 'react';
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
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { vendorApi } from '../../api/client';
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const VendorDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { can } = useAuth();
  const { id } = route.params;

  const [vendor, setVendor] = useState(null);
  const [activities, setActivities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('collection');
  const [loading, setLoading] = useState(true);

  const fetchVendorDetails = useCallback(async () => {
    try {
      const res = await vendorApi.getById(id);
      if (res.success) {
        setVendor(res.data.vendor);
        setActivities(res.data.activities || []);
        setPayments(res.data.payments || []);
      }
    } catch (err) {
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
        setVendor({ ...vendor, status: res.data.status });
        Alert.alert('Updated', `Vendor status changed to ${res.data.status}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update status');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
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
                  defaultPartyType: 'vendor',
                  defaultPartyId: vendor._id,
                  defaultType: 'collection',
                })
              }
            />
          </View>
        </Card>

        {/* Tabs: Collection History vs Payments History */}
        <View style={styles.historyTabsRow}>
          <TouchableOpacity
            style={[styles.historyTab, activeTab === 'collection' && styles.historyTabActive]}
            onPress={() => setActiveTab('collection')}
          >
            <Ionicons
              name="water-outline"
              size={16}
              color={activeTab === 'collection' ? Colors.primary : Colors.slate500}
            />
            <Text
              style={[
                styles.historyTabText,
                activeTab === 'collection' && styles.historyTabTextActive,
              ]}
            >
              Milk Collections ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyTab, activeTab === 'payments' && styles.historyTabActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={activeTab === 'payments' ? Colors.primary : Colors.slate500}
            />
            <Text
              style={[
                styles.historyTabText,
                activeTab === 'payments' && styles.historyTabTextActive,
              ]}
            >
              Payouts ({payments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        {activeTab === 'collection' ? (
          activities.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No milk collection entries found</Text>
            </Card>
          ) : (
            activities.map((act) => (
              <TouchableOpacity
                key={act._id}
                style={styles.itemRowCard}
                onPress={() => navigation.navigate('ActivityDetail', { id: act._id })}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemDate}>{formatDate(act.date)}</Text>
                  <Text style={styles.itemSub}>
                    {act.session} • {act.milkType} • ₹{act.ratePerLitre}/L
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemQty}>{formatLitres(act.quantityLitres)}</Text>
                  <Text style={styles.itemAmount}>{formatCurrency(act.totalAmount)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : payments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payout transactions recorded</Text>
          </Card>
        ) : (
          payments.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.itemRowCard}
              onPress={() => navigation.navigate('Receipt', { id: p._id })}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemDate}>{formatDate(p.date)}</Text>
                <Text style={styles.itemSub}>
                  {p.paymentMode} • Ref: {p.paymentNumber}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemAmount, { color: Colors.danger }]}>
                  - {formatCurrency(p.amount)}
                </Text>
                <Text style={styles.statusText}>{p.status}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
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
    marginTop: 4,
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
    color: Colors.slate600,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  quickInfoBox: {
    width: '50%',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  quickInfoLabel: {
    fontSize: 10,
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
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  financialBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: Spacing.md,
  },
  financialNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.slate200,
  },
  finLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 4,
  },
  finVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
  },
  historyTabsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  historyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  historyTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
    marginLeft: 6,
  },
  historyTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  itemRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  itemLeft: {
    flex: 1,
  },
  itemDate: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  itemSub: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 1,
  },
  statusText: {
    fontSize: 10,
    color: Colors.slate400,
    textTransform: 'uppercase',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.slate400,
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
});
