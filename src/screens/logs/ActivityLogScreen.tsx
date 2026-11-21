import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { logApi } from '../../api/client';
import { ActivityLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { useFocusEffect } from '@react-navigation/native';

export const ActivityLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await logApi.getAll({
        module: selectedModule === 'all' ? undefined : selectedModule,
      });
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedModule]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'PAYMENT':
        return 'primary';
      case 'DEACTIVATE':
      case 'DELETE':
        return 'danger';
      case 'REVERSAL':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const renderLogItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{item.role}</Text>
          </View>
        </View>
        <Badge
          label={item.action}
          variant={getActionBadgeVariant(item.action) as any}
          size="sm"
        />
      </View>

      <Text style={styles.detailsText}>{item.details || `${item.action} action on ${item.module}`}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.moduleTag}>
          <Ionicons name="folder-outline" size={12} color={Colors.slate500} />
          <Text style={styles.moduleText}>{item.module}</Text>
        </View>
        <Text style={styles.timeText}>{formatDateTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Audit Activity Log"
        subtitle="Security & Operations Trail"
        showBack
      />

      {/* Module Filter Scroll */}
      <View style={styles.moduleFilterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'Vendors', 'Customers', 'Buyers', 'Daily Activity', 'Payments', 'Masters', 'Users', 'Auth']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.modulePill,
                selectedModule === item && styles.modulePillActive,
              ]}
              onPress={() => setSelectedModule(item)}
            >
              <Text
                style={[
                  styles.modulePillText,
                  selectedModule === item && styles.modulePillTextActive,
                ]}
              >
                {item === 'all' ? 'All Modules' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title="No Audit Logs"
              message="No recorded system logs for the selected module."
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
  moduleFilterBar: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modulePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  modulePillActive: {
    backgroundColor: Colors.slate900,
  },
  modulePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  modulePillTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
    marginRight: 6,
  },
  roleTag: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    color: Colors.slate600,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsText: {
    fontSize: 13,
    color: Colors.slate700,
    lineHeight: 18,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleText: {
    fontSize: 11,
    color: Colors.slate500,
    marginLeft: 4,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: Colors.slate400,
  },
});
