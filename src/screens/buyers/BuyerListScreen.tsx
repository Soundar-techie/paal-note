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
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { buyerApi } from '../../api/client';
import { Buyer } from '../../types';
import { formatCurrency, formatLitres } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const BuyerListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { can } = useAuth();

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await buyerApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      if (res.success) {
        setBuyers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching buyers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchBuyers();
    }, [fetchBuyers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuyers();
  };

  const renderBuyerItem = ({ item }: { item: Buyer }) => (
    <TouchableOpacity
      style={styles.buyerCard}
      onPress={() => navigation.navigate('BuyerDetail', { id: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.buyerIdBadge}>
          <Text style={styles.buyerIdText}>{item.buyerId}</Text>
        </View>
        <View style={styles.buyerHeaderInfo}>
          <Text style={styles.buyerName}>{item.name}</Text>
          {item.businessName ? (
            <Text style={styles.businessText}>{item.businessName}</Text>
          ) : null}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={Colors.slate500} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        <Badge
          label={item.status}
          variant={item.status === 'active' ? 'success' : 'neutral'}
        />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardMetricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Purchased</Text>
          <Text style={styles.metricVal}>{formatLitres(item.totalPurchasedLitres)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Invoiced</Text>
          <Text style={styles.metricVal}>{formatCurrency(item.totalAmount)}</Text>
        </View>

        <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
          <Text style={styles.metricLabel}>Due Balance</Text>
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
        title="Bulk Milk Buyers"
        subtitle={`${buyers.length} commercial buyers`}
        showBack
        rightAction={
          can('canManageParties')
            ? {
                icon: 'add-circle-outline',
                onPress: () => navigation.navigate('BuyerForm', {}),
              }
            : undefined
        }
      />

      <View style={styles.filterSection}>
        <Input
          placeholder="Search by buyer name, business, location..."
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
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={buyers}
          keyExtractor={(item) => item._id}
          renderItem={renderBuyerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No Buyers Found"
              message="No commercial buyers found. Add buyers for bulk milk sales."
              actionTitle={can('canManageParties') ? 'Add New Buyer' : undefined}
              onAction={() => navigation.navigate('BuyerForm', {})}
            />
          }
        />
      )}

      {can('canManageParties') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('BuyerForm', {})}
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
    backgroundColor: Colors.accent,
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
  buyerCard: {
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
  buyerIdBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  buyerIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
  },
  buyerHeaderInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  businessText: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '500',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
