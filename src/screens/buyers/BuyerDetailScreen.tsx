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
import { buyerApi } from '../../api/client';
import { Buyer, DailyActivity, Payment } from '../../types';
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const BuyerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { can } = useAuth();
  const { id } = route.params;

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBuyerDetails = useCallback(async () => {
    try {
      const res = await buyerApi.getById(id);
      if (res.success) {
        setBuyer(res.data.buyer);
        setActivities(res.data.activities || []);
        setPayments(res.data.payments || []);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load buyer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchBuyerDetails();
    }, [fetchBuyerDetails])
  );

  const handleToggleStatus = async () => {
    if (!buyer) return;
    try {
      const res = await buyerApi.toggleStatus(buyer._id);
      if (res.success) {
        setBuyer(res.data);
        Alert.alert('Status Updated', `Buyer is now ${res.data.status}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!buyer) {
    return (
      <View style={styles.container}>
        <Header title="Buyer Detail" showBack />
        <View style={styles.errorContainer}>
          <Text>Buyer not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={buyer.name}
        subtitle={`${buyer.buyerId} • ${buyer.location}`}
        showBack
        rightAction={
          can('canManageParties')
            ? {
                icon: 'create-outline',
                onPress: () => navigation.navigate('BuyerForm', { buyer }),
              }
            : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.profileName}>{buyer.name}</Text>
              {buyer.businessName ? (
                <Text style={styles.businessText}>{buyer.businessName}</Text>
              ) : null}
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.slate500} />
                <Text style={styles.locationText}>{buyer.location}</Text>
              </View>
              {buyer.phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color={Colors.slate500} />
                  <Text style={styles.phoneText}>{buyer.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleToggleStatus} disabled={!can('canManageParties')}>
              <Badge
                label={buyer.status}
                variant={buyer.status === 'active' ? 'success' : 'danger'}
                size="md"
              />
            </TouchableOpacity>
          </View>

          {buyer.address ? (
            <Text style={styles.addressText}>
              <Text style={{ fontWeight: '600' }}>Address: </Text>
              {buyer.address}
            </Text>
          ) : null}
        </Card>

        {/* Financial Balance Sheet */}
        <Card style={styles.financialBanner}>
          <Text style={styles.financialBannerTitle}>Commercial Sales Ledger</Text>
          <View style={styles.financialNumbersRow}>
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Sales</Text>
              <Text style={styles.finVal}>{formatCurrency(buyer.totalAmount)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Total Paid</Text>
              <Text style={[styles.finVal, { color: Colors.primary }]}>
                {formatCurrency(buyer.totalPaid)}
              </Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.finLabel}>Outstanding Due</Text>
              <Text
                style={[
                  styles.finVal,
                  { color: buyer.balance > 0 ? Colors.danger : Colors.success },
                ]}
              >
                {formatCurrency(buyer.balance)}
              </Text>
            </View>
          </View>

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
                    partyType: 'buyer',
                    partyId: buyer._id,
                  })
                }
              />
            )}
            <Button
              title="Add Bulk Sale"
              icon="add-circle-outline"
              variant="secondary"
              size="sm"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() =>
                navigation.navigate('AddActivity', {
                  defaultType: 'buyer_sale',
                  partyType: 'buyer',
                  partyId: buyer._id,
                })
              }
            />
          </View>
        </Card>

        {/* History Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'sales' && styles.tabBtnActive]}
            onPress={() => setActiveTab('sales')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'sales' && styles.tabBtnTextActive]}>
              Bulk Sales ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}>
              Collections ({payments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Sales History */}
        {activeTab === 'sales' && (
          <View>
            {activities.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No bulk sales recorded yet.</Text>
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

        {/* Tab 2: Payments History */}
        {activeTab === 'payments' && (
          <View>
            {payments.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No payments recorded yet.</Text>
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
  businessText: {
    fontSize: 13,
    color: Colors.slate600,
    marginTop: 2,
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
    color: Colors.accent,
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
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 3,
  },
});
