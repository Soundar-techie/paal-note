import React, { useState, useEffect, useCallback } from 'react';
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
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { customerApi } from '../../api/client';
import { Customer } from '../../types';
import { formatCurrency, formatLitres } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const CustomerListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { can } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const dailyTotal = (item.dailyMorningQuantity || 0) + (item.dailyEveningQuantity || 0);

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => navigation.navigate('CustomerDetail', { id: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.customerIdBadge}>
            <Text style={styles.customerIdText}>{item.customerId}</Text>
          </View>
          <View style={styles.customerHeaderInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Colors.slate500} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.typePill,
                  item.customerType === 'daily'
                    ? styles.typePillDaily
                    : item.customerType === 'seasonal'
                    ? styles.typePillSeasonal
                    : styles.typePillOccasional,
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    item.customerType === 'daily'
                      ? styles.typePillTextDaily
                      : item.customerType === 'seasonal'
                      ? styles.typePillTextSeasonal
                      : styles.typePillTextOccasional,
                  ]}
                >
                  {item.customerType || 'daily'}
                </Text>
              </View>
              <Badge
                label={item.status}
                variant={item.status === 'active' ? 'success' : 'neutral'}
              />
            </View>
            <View style={styles.scheduleBadge}>
              <Ionicons name="calendar-outline" size={11} color={Colors.primary} />
              <Text style={styles.scheduleBadgeText}>
                {item.paymentFrequency === 'daily'
                  ? 'Daily'
                  : item.paymentFrequency === 'weekly'
                  ? `Weekly (${(item.payoutCycleDay || 'Sun').slice(0, 3)})`
                  : `Monthly (${item.payoutCycleDate || 1}th)`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Daily Plan</Text>
            <Text style={styles.metricVal}>
              ☀️ {item.dailyMorningQuantity}L + 🌙 {item.dailyEveningQuantity}L
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Rate</Text>
            <Text style={styles.metricVal}>₹{item.defaultRate}/L</Text>
          </View>

          <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.metricLabel}>Receivable Due</Text>
            <Text
              style={[
                styles.metricVal,
                { color: item.balance > 0 ? Colors.danger : Colors.success },
              ]}
            >
              {formatCurrency(item.balance)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Milk Customers"
        subtitle={`${customers.length} households registered`}
        rightAction={
          can('canManageParties')
            ? {
                icon: 'add-circle-outline',
                onPress: () => navigation.navigate('CustomerForm', {}),
              }
            : undefined
        }
      />

      <View style={styles.filterSection}>
        <Input
          placeholder="Search by customer name, ID, location, phone..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          style={styles.searchInput}
        />

        <View style={styles.statusPillsRow}>
          <TouchableOpacity
            style={[styles.statusPill, statusFilter === 'active' && styles.statusPillActive]}
            onPress={() => setStatusFilter('active')}
          >
            <Text style={[styles.statusPillText, statusFilter === 'active' && styles.statusPillTextActive]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusPill, statusFilter === 'inactive' && styles.statusPillActive]}
            onPress={() => setStatusFilter('inactive')}
          >
            <Text style={[styles.statusPillText, statusFilter === 'inactive' && styles.statusPillTextActive]}>
              Inactive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusPill, statusFilter === 'all' && styles.statusPillActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.statusPillText, statusFilter === 'all' && styles.statusPillTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item._id}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="No Customers Found"
              message="No customers match your search query."
              actionTitle={can('canManageParties') ? 'Add New Customer' : undefined}
              onAction={() => navigation.navigate('CustomerForm', {})}
            />
          }
        />
      )}

      {can('canManageParties') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CustomerForm', {})}
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
  filterSection: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    minHeight: 40,
    paddingVertical: 6,
  },
  statusPillsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  statusPillActive: {
    backgroundColor: Colors.secondary,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  statusPillTextActive: {
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
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIdBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  customerIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
  },
  customerHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: Colors.slate500,
    marginLeft: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: Spacing.md,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  typePillDaily: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  typePillOccasional: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  typePillSeasonal: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typePillTextDaily: {
    color: '#1D4ED8',
  },
  typePillTextOccasional: {
    color: '#B45309',
  },
  typePillTextSeasonal: {
    color: '#7E22CE',
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
    marginLeft: 3,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
