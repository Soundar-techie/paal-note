import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { paymentApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const PaymentListScreen = () => {
  const navigation = useNavigation();
  const { can } = useAuth();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partyTypeFilter, setPartyTypeFilter] = useState('all');

  const fetchPayments = useCallback(async () => {
    try {
      const res = await paymentApi.getAll({
        partyType: partyTypeFilter === 'all' ? undefined : partyTypeFilter,
      });

      if (res.success) {
        setPayments(res.data || []);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partyTypeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const renderPaymentItem = ({ item }) => {
    const isPay = item.paymentType === 'pay'; // Pay to vendor (expense) vs Receive from customer/buyer (income)

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        onPress={() => navigation.navigate('Receipt', { id: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isPay ? Colors.dangerLight : Colors.successLight },
            ]}
          >
            <Ionicons
              name={isPay ? 'arrow-up' : 'arrow-down'}
              size={18}
              color={isPay ? Colors.danger : Colors.success}
            />
          </View>

          <View style={styles.infoCol}>
            <View style={styles.topRow}>
              <Text style={styles.partyName} numberOfLines={1}>
                {item.partyName}
              </Text>
              <Text style={styles.paymentDate}>{formatDate(item.date)}</Text>
            </View>

            <Text style={styles.metaText}>
              {item.paymentNumber} • {item.partyType.toUpperCase()} • {item.paymentMode}
            </Text>

            {item.referenceNumber ? (
              <Text style={styles.refText}>Ref: {item.referenceNumber}</Text>
            ) : null}

            {item.status === 'reversed' && (
              <Text style={styles.reversedNotice}>⚠️ Reversed</Text>
            )}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text
            style={[
              styles.amountText,
              { color: isPay ? Colors.danger : Colors.success },
            ]}
          >
            {isPay ? '-' : '+'} {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.receiptAction}>View Receipt &gt;</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Payments & Cash Flow"
        subtitle="Financial Settlements & Receipts"
        showBack
        rightAction={
          can('canRecordPayments')
            ? {
                icon: 'add-circle-outline',
                onPress: () => navigation.navigate('RecordPayment', {}),
              }
            : undefined
        }
      />

      {/* Financial Metrics Strip */}
      {summary && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={[styles.summaryVal, { color: Colors.success }]}>
              {formatCurrency(summary.totalReceivedAll)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid to Vendors</Text>
            <Text style={[styles.summaryVal, { color: Colors.danger }]}>
              {formatCurrency(summary.totalPaidToVendors)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Cash Flow</Text>
            <Text
              style={[
                styles.summaryVal,
                { color: summary.netCashFlow >= 0 ? Colors.success : Colors.danger },
              ]}
            >
              {formatCurrency(summary.netCashFlow)}
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[styles.filterPill, partyTypeFilter === 'all' && styles.filterPillActive]}
          onPress={() => setPartyTypeFilter('all')}
        >
          <Text style={[styles.filterPillText, partyTypeFilter === 'all' && styles.filterPillTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, partyTypeFilter === 'vendor' && styles.filterPillActive]}
          onPress={() => setPartyTypeFilter('vendor')}
        >
          <Text style={[styles.filterPillText, partyTypeFilter === 'vendor' && styles.filterPillTextActive]}>
            Vendors (Payouts)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, partyTypeFilter === 'customer' && styles.filterPillActive]}
          onPress={() => setPartyTypeFilter('customer')}
        >
          <Text style={[styles.filterPillText, partyTypeFilter === 'customer' && styles.filterPillTextActive]}>
            Customers (Receipts)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, partyTypeFilter === 'buyer' && styles.filterPillActive]}
          onPress={() => setPartyTypeFilter('buyer')}
        >
          <Text style={[styles.filterPillText, partyTypeFilter === 'buyer' && styles.filterPillTextActive]}>
            Buyers (Bulk)
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No Payments Recorded"
              message="No financial payments found for this filter."
              actionTitle={can('canRecordPayments') ? 'Record New Payment' : undefined}
              onAction={() => navigation.navigate('RecordPayment', {})}
            />
          }
        />
      )}

      {can('canRecordPayments') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('RecordPayment', {})}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.slate500,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.slate200,
  },
  filterPillsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 6,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    flex: 1,
  },
  paymentDate: {
    fontSize: 11,
    color: Colors.slate400,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  refText: {
    fontSize: 11,
    color: Colors.slate600,
    fontStyle: 'italic',
    marginTop: 2,
  },
  reversedNotice: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  receiptAction: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
