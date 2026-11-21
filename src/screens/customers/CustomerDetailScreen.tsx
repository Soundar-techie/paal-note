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
import { customerApi } from '../../api/client';
import { Customer, DailyActivity, Payment } from '../../types';
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { can } = useAuth();
  const { id } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'distribution' | 'payments'>('distribution');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      const res = await customerApi.getById(id);
      if (res.success) {
        setCustomer(res.data.customer);
        setStats(res.data.stats);
        setActivities(res.data.activities || []);
        setPayments(res.data.payments || []);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomerDetails();
    }, [fetchCustomerDetails])
  );

  const handleToggleStatus = async () => {
    if (!customer) return;
    try {
      const res = await customerApi.toggleStatus(customer._id);
      if (res.success) {
        setCustomer(res.data);
        Alert.alert('Status Updated', `Customer is now ${res.data.status}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.container}>
        <Header title="Customer Detail" showBack />
        <View style={styles.errorContainer}>
          <Text>Customer not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={customer.name}
        subtitle={`${customer.customerId} • ${customer.location}`}
        showBack
        rightAction={
          can('canManageParties')
            ? {
                icon: 'create-outline',
                onPress: () => navigation.navigate('CustomerForm', { customer }),
              }
            : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.profileName}>{customer.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.slate500} />
                <Text style={styles.locationText}>{customer.location}</Text>
              </View>
              {customer.phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color={Colors.slate500} />
                  <Text style={styles.phoneText}>{customer.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleToggleStatus} disabled={!can('canManageParties')}>
              <Badge
                label={customer.status}
                variant={customer.status === 'active' ? 'success' : 'danger'}
                size="md"
              />
            </TouchableOpacity>
          </View>

          {customer.address ? (
            <Text style={styles.addressText}>
              <Text style={{ fontWeight: '600' }}>Address: </Text>
              {customer.address}
            </Text>
          ) : null}

          {/* Daily Quota Box */}
          <View style={styles.quotaBox}>
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Morning Quota</Text>
              <Text style={[styles.quotaVal, { color: Colors.morning }]}>
                ☀️ {customer.dailyMorningQuantity} L
              </Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Evening Quota</Text>
              <Text style={[styles.quotaVal, { color: Colors.evening }]}>
                🌙 {customer.dailyEveningQuantity} L
              </Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Price Rate</Text>
              <Text style={styles.quotaVal}>₹{customer.defaultRate}/L</Text>
            </View>
          </View>

          {/* Classification & Billing Schedule */}
          <View style={[styles.quotaBox, { marginTop: Spacing.sm }]}>
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Customer Type</Text>
              <Text style={[styles.quotaVal, { textTransform: 'capitalize' }]}>
                {customer.customerType || 'daily'}
              </Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Billing Frequency</Text>
              <Text style={[styles.quotaVal, { textTransform: 'capitalize' }]}>
                {customer.paymentFrequency || 'monthly'}
              </Text>
            </View>
            <View style={styles.quotaDivider} />
            <View style={styles.quotaItem}>
              <Text style={styles.quotaLabel}>Billing Cycle</Text>
              <Text style={styles.quotaVal}>
                {customer.paymentFrequency === 'daily'
                  ? 'Daily'
                  : customer.paymentFrequency === 'weekly'
                  ? `Every ${customer.payoutCycleDay || 'Sunday'}`
                  : `Every ${customer.payoutCycleDate || 1}th`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Financial Balance Sheet */}
        <Card style={styles.financialBanner}>
          <Text style={styles.financialBannerTitle}>Customer Account Balance</Text>
          <View style={styles.financialNumbersRow}>
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Billed</Text>
              <Text style={styles.finVal}>{formatCurrency(customer.totalReceivable)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Collected</Text>
              <Text style={[styles.finVal, { color: Colors.primary }]}>
                {formatCurrency(customer.totalReceived)}
              </Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Receivable Due</Text>
              <Text
                style={[
                  styles.finVal,
                  { color: customer.balance > 0 ? Colors.danger : Colors.success },
                ]}
              >
                {formatCurrency(customer.balance)}
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            {can('canRecordPayments') && (
              <Button
                title="Collect Payment"
                icon="cash-outline"
                variant="primary"
                size="sm"
                style={{ flex: 1, marginRight: 6 }}
                onPress={() =>
                  navigation.navigate('RecordPayment', {
                    partyType: 'customer',
                    partyId: customer._id,
                  })
                }
              />
            )}
            <Button
              title="Record Delivery"
              icon="add-circle-outline"
              variant="secondary"
              size="sm"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() =>
                navigation.navigate('AddActivity', {
                  defaultType: 'distribution',
                  partyType: 'customer',
                  partyId: customer._id,
                })
              }
            />
          </View>
        </Card>

        {/* History Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'distribution' && styles.tabBtnActive]}
            onPress={() => setActiveTab('distribution')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'distribution' && styles.tabBtnTextActive,
              ]}
            >
              Delivery History ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}
            >
              Collections ({payments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Delivery History */}
        {activeTab === 'distribution' && (
          <View>
            {activities.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No delivery records logged yet.</Text>
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

        {/* Tab 2: Payments Received */}
        {activeTab === 'payments' && (
          <View>
            {payments.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No payment receipts recorded yet.</Text>
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
                    <Text style={[styles.historyQty, { color: Colors.success }]}>
                      + {formatCurrency(p.amount)}
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
  quotaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  quotaItem: {
    alignItems: 'center',
    flex: 1,
  },
  quotaDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.slate200,
  },
  quotaLabel: {
    fontSize: 10,
    color: Colors.slate500,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quotaVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
    color: Colors.slate800,
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
    color: Colors.secondary,
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
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 3,
  },
});
