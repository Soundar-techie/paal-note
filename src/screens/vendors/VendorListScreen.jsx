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
import { formatCurrency, formatLitres } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const VendorListScreen = () => {
  const navigation = useNavigation();
  const { can } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

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

  const renderVendorItem = ({ item }) => (
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
          <Text style={styles.metricValue}>
            {item.defaultMilkType} • ₹{item.defaultRate}/L
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Supplied</Text>
          <Text style={styles.metricValue}>{formatLitres(item.totalCollectedLitres)}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Balance Due</Text>
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

  return (
    <View style={styles.container}>
      <Header
        title="Milk Suppliers"
        subtitle="Farmers & Vendors Directory"
        rightAction={
          can('canManageParties')
            ? {
                icon: 'person-add',
                onPress: () => navigation.navigate('VendorForm'),
              }
            : undefined
        }
      />

      {/* Search & Filter Bar */}
      <View style={styles.filterSection}>
        <Input
          placeholder="Search by vendor name, code, or location..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          style={{ height: 42 }}
        />

        {/* Status Filter Tabs */}
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
              All Vendors
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vendors List */}
      {loading ? (
        <View style={styles.centerContainer}>
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
              message={
                search
                  ? `No suppliers matched "${search}". Try adjusting your search query.`
                  : 'Start by adding your first dairy milk supplier or farmer.'
              }
              actionTitle={can('canManageParties') ? 'Add New Vendor' : undefined}
              onAction={can('canManageParties') ? () => navigation.navigate('VendorForm') : undefined}
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
  vendorCard: {
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
  vendorIdBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: 10,
  },
  vendorIdText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
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
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  scheduleBadgeText: {
    fontSize: 10,
    color: Colors.slate600,
    marginLeft: 3,
    fontWeight: '600',
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
    fontSize: 12,
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
