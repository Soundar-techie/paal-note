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
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { vendorApi } from '../../api/client';
import { Vendor } from '../../types';
import { formatCurrency, formatLitres } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const VendorListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { can } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const fetchVendors = useCallback(async () => {
    try {
      const res = await vendorApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      if (res.success) {
        setVendors(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchVendors();
    }, [fetchVendors])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => navigation.navigate('VendorDetail', { id: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorIdBadge}>
          <Text style={styles.vendorIdText}>{item.vendorId}</Text>
        </View>
        <View style={styles.vendorHeaderInfo}>
          <Text style={styles.vendorName}>{item.name}</Text>
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
          <View style={styles.scheduleBadge}>
            <Ionicons name="calendar-outline" size={11} color={Colors.primary} />
            <Text style={styles.scheduleBadgeText}>
              {item.paymentFrequency === 'daily'
                ? 'Daily'
                : item.paymentFrequency === 'monthly'
                ? `Monthly (${item.payoutCycleDate || 1}th)`
                : `Weekly (${(item.payoutCycleDay || 'Sun').slice(0, 3)})`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardMetricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Milk Type & Rate</Text>
          <Text style={styles.metricVal}>
            {item.defaultMilkType} • ₹{item.defaultRate}/L
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Supplied</Text>
          <Text style={styles.metricVal}>{formatLitres(item.totalCollectedLitres)}</Text>
        </View>

        <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
          <Text style={styles.metricLabel}>Payable Balance</Text>
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

  return (
    <View style={styles.container}>
      <Header
        title="Milk Suppliers (Vendors)"
        subtitle={`${vendors.length} vendors registered`}
        rightAction={
          can('canManageParties')
            ? {
                icon: 'add-circle-outline',
                onPress: () => navigation.navigate('VendorForm', {}),
              }
            : undefined
        }
      />

      <View style={styles.filterSection}>
        <Input
          placeholder="Search by name, ID, location, phone..."
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
          data={vendors}
          keyExtractor={(item) => item._id}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Vendors Found"
              message="No dairy suppliers match your search or filter criteria."
              actionTitle={can('canManageParties') ? 'Add New Vendor' : undefined}
              onAction={() => navigation.navigate('VendorForm', {})}
            />
          }
        />
      )}

      {/* Floating Add Button */}
      {can('canManageParties') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('VendorForm', {})}
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
    backgroundColor: Colors.primary,
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
  vendorCard: {
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
  vendorIdBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  vendorIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  vendorHeaderInfo: {
    flex: 1,
  },
  vendorName: {
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
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scheduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 3,
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
