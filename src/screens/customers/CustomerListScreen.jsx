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
import { formatCurrency, formatLitres } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const CustomerListScreen = () => {
  const navigation = useNavigation();
  const { can } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

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

  const renderCustomerItem = ({ item }) => {
    const totalDailyQuota = item.dailyMorningQuantity + item.dailyEveningQuantity;

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
            <Badge
              label={item.status}
              variant={item.status === 'active' ? 'success' : 'neutral'}
            />
            <Text style={styles.typeLabel}>{item.customerType}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Quotas & Financials */}
        <View style={styles.cardMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Daily Quota</Text>
            <Text style={styles.metricValue}>
              {formatLitres(totalDailyQuota)} (M: {item.dailyMorningQuantity} | E: {item.dailyEveningQuantity})
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Rate & Type</Text>
            <Text style={styles.metricValue}>
              ₹{item.defaultRate}/L • {item.defaultMilkType}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Receivable</Text>
            <Text
              style={[
                styles.metricValue,
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
        title="Household Customers"
        subtitle="Daily Milk Delivery Directory"
        rightAction={
          can('canManageParties')
            ? {
                icon: 'person-add',
                onPress: () => navigation.navigate('CustomerForm'),
              }
            : undefined
        }
      />

      {/* Search & Status Filters */}
      <View style={styles.filterSection}>
        <Input
          placeholder="Search by name, customer code, location..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          style={{ height: 42 }}
        />

        <View style={styles.tabFilterRow}>
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'active' && styles.filterTabActive]}
            onPress={() => setStatusFilter('active')}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === 'active' && styles.filterTabTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'inactive' && styles.filterTabActive]}
            onPress={() => setStatusFilter('inactive')}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === 'inactive' && styles.filterTabTextActive,
              ]}
            >
              Inactive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All Customers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
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
              message={
                search
                  ? `No customers matched "${search}".`
                  : 'Start adding households to manage morning and evening delivery routes.'
              }
              actionTitle={can('canManageParties') ? 'Add Customer' : undefined}
              onAction={can('canManageParties') ? () => navigation.navigate('CustomerForm') : undefined}
            />
          }
        />
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabFilterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    marginRight: 8,
    backgroundColor: Colors.slate100,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderRadius: BorderRadius.sm,
    marginRight: 10,
  },
  customerIdText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
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
  typeLabel: {
    fontSize: 10,
    color: Colors.slate400,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: Spacing.sm,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.slate400,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate800,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.slate100,
    marginHorizontal: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
