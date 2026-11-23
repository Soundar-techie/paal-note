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
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const CustomerDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { can } = useAuth();
  const { id } = route.params;

  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('distribution');
  const [loading, setLoading] = useState(true);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      const res = await customerApi.getById(id);
      if (res.success) {
        setCustomer(res.data.customer);
        setActivities(res.data.activities || []);
        setPayments(res.data.payments || []);
      }
    } catch (err) {
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
        setCustomer({ ...customer, status: res.data.status });
        Alert.alert('Updated', `Customer status changed to ${res.data.status}`);
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

          {/* Delivery Quota Information */}
          <View style={styles.quotaBox}>
            <Text style={styles.quotaBoxTitle}>Scheduled Daily Quota</Text>
            <View style={styles.quotaRow}>
              <View style={styles.quotaItem}>
                <Ionicons name="sunny" size={16} color={Colors.morning} />
                <Text style={styles.quotaLabel}>Morning: </Text>
                <Text style={styles.quotaVal}>{formatLitres(customer.dailyMorningQuantity)}</Text>
              </View>
              <View style={styles.quotaItem}>
                <Ionicons name="moon" size={16} color={Colors.evening} />
                <Text style={styles.quotaLabel}>Evening: </Text>
                <Text style={styles.quotaVal}>{formatLitres(customer.dailyEveningQuantity)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Milk Variety</Text>
              <Text style={styles.quickInfoVal}>{customer.defaultMilkType}</Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Selling Rate</Text>
              <Text style={styles.quickInfoVal}>₹{customer.defaultRate}/L</Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Frequency</Text>
              <Text style={[styles.quickInfoVal, { textTransform: 'capitalize' }]}>
                {customer.paymentFrequency || 'monthly'}
              </Text>
            </View>
            <View style={styles.quickInfoBox}>
              <Text style={styles.quickInfoLabel}>Settlement Day</Text>
              <Text style={styles.quickInfoVal}>
                {customer.paymentFrequency === 'monthly'
                  ? `Every ${customer.payoutCycleDate || 1}th`
                  : customer.paymentFrequency === 'weekly'
                  ? `Every ${customer.payoutCycleDay || 'Sunday'}`
                  : 'Daily Collection'}
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
              <Text style={styles.finLabel}>Payments Received</Text>
              <Text style={[styles.finVal, { color: Colors.success }]}>
                {formatCurrency(customer.totalReceived)}
              </Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Balance Due</Text>
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

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {can('canRecordPayments') && (
              <Button
                title="Receive Payment"
                icon="cash-outline"
                variant="primary"
                size="sm"
                style={{ flex: 1, marginRight: 6 }}
                onPress={() =>
                  navigation.navigate('RecordPayment', {
                    partyType: 'customer',
                    partyId: customer._id,
                    defaultPaymentType: 'receive',
                  })
                }
              />
            )}
            <Button
              title="Deliver Milk"
              icon="arrow-forward-circle-outline"
              variant="secondary"
              size="sm"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() =>
                navigation.navigate('AddActivity', {
                  defaultPartyType: 'customer',
                  defaultPartyId: customer._id,
                  defaultType: 'distribution',
                })
              }
            />
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.historyTabsRow}>
          <TouchableOpacity
            style={[styles.historyTab, activeTab === 'distribution' && styles.historyTabActive]}
            onPress={() => setActiveTab('distribution')}
          >
            <Ionicons
              name="water-outline"
              size={16}
              color={activeTab === 'distribution' ? Colors.secondary : Colors.slate500}
            />
            <Text
              style={[
                styles.historyTabText,
                activeTab === 'distribution' && styles.historyTabTextActive,
              ]}
            >
              Deliveries ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyTab, activeTab === 'payments' && styles.historyTabActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={activeTab === 'payments' ? Colors.success : Colors.slate500}
            />
            <Text
              style={[
                styles.historyTabText,
                activeTab === 'payments' && styles.historyTabTextActive,
              ]}
            >
              Collections ({payments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'distribution' ? (
          activities.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No delivery records found</Text>
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
                  <Text style={[styles.itemQty, { color: Colors.secondary }]}>
                    {formatLitres(act.quantityLitres)}
                  </Text>
                  <Text style={styles.itemAmount}>{formatCurrency(act.totalAmount)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : payments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payment receipts recorded</Text>
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
                <Text style={[styles.itemAmount, { color: Colors.success }]}>
                  + {formatCurrency(p.amount)}
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
  quotaBox: {
    backgroundColor: Colors.slate50,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  quotaBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quotaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 12,
    color: Colors.slate600,
    marginLeft: 4,
  },
  quotaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate800,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  quickInfoBox: {
    width: '50%',
    paddingVertical: 4,
    paddingRight: 8,
  },
  quickInfoLabel: {
    fontSize: 10,
    color: Colors.slate400,
    textTransform: 'uppercase',
  },
  quickInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 1,
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
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryLight,
  },
  historyTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
    marginLeft: 6,
  },
  historyTabTextActive: {
    color: Colors.secondary,
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
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate800,
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
