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
import { Badge } from '../../components/common/Badge';
import { SessionToggle } from '../../components/common/SessionToggle';
import { EmptyState } from '../../components/common/EmptyState';
import { Card } from '../../components/common/Card';
import { activityApi } from '../../api/client';
import { DailyActivity, SessionType, ActivityType } from '../../types';
import { formatCurrency, formatLitres, formatDate, getTodayDateString } from '../../utils/formatters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const DailyActivityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { can } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedSession, setSelectedSession] = useState<SessionType | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await activityApi.getAll({
        date: selectedDate,
        session: selectedSession === 'all' ? undefined : selectedSession,
        type: selectedType === 'all' ? undefined : selectedType,
      });

      if (res.success) {
        setActivities(res.data || []);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedSession, selectedType]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const renderActivityItem = ({ item }: { item: DailyActivity }) => {
    const isCollection = item.type === 'collection';

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => navigation.navigate('ActivityDetail', { id: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.typeIconCircle,
              {
                backgroundColor: isCollection ? Colors.primaryLight : Colors.secondaryLight,
              },
            ]}
          >
            <Ionicons
              name={isCollection ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={isCollection ? Colors.primary : Colors.secondary}
            />
          </View>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.partyName} numberOfLines={1}>
                {item.partyName}
              </Text>
              <Badge label={item.session} variant={item.session} size="sm" />
            </View>

            <Text style={styles.partyMeta}>
              {item.partyCode} • {item.partyLocation} • {item.milkType}
            </Text>

            {item.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                Note: {item.notes}
              </Text>
            ) : null}

            {item.status === 'corrected' && (
              <Text style={styles.correctedBadge}>• Corrected entry</Text>
            )}
            {item.status === 'reversed' && (
              <Text style={styles.reversedBadge}>• REVERSED (Invalidated)</Text>
            )}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.quantityText}>{formatLitres(item.quantityLitres)}</Text>
          <Text style={styles.rateCalculation}>
            @ ₹{item.ratePerLitre}/L
          </Text>
          <Text style={[styles.amountText, { color: isCollection ? Colors.danger : Colors.primary }]}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Daily Milk Operations"
        subtitle={`${formatDate(selectedDate)} Records`}
        rightAction={{
          icon: 'add-circle',
          onPress: () => navigation.navigate('AddActivity', {}),
        }}
      />

      {/* Date & Filter Controls */}
      <View style={styles.controlsBar}>
        {/* Date Navigator */}
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.navArrow} onPress={handlePrevDay}>
            <Ionicons name="chevron-back" size={16} color={Colors.slate700} />
          </TouchableOpacity>
          <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.navArrow} onPress={handleNextDay}>
            <Ionicons name="chevron-forward" size={16} color={Colors.slate700} />
          </TouchableOpacity>
        </View>

        {/* Morning / Evening Toggle */}
        <SessionToggle
          selected={selectedSession}
          onSelect={(s) => setSelectedSession(s)}
          showAllOption
        />
      </View>

      {/* Type Filter Pills */}
      <View style={styles.typePillsRow}>
        <TouchableOpacity
          style={[styles.typePill, selectedType === 'all' && styles.typePillActive]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.typePillText, selectedType === 'all' && styles.typePillTextActive]}>
            All Entries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typePill, selectedType === 'collection' && styles.typePillActiveColl]}
          onPress={() => setSelectedType('collection')}
        >
          <Text
            style={[
              styles.typePillText,
              selectedType === 'collection' && styles.typePillTextActive,
            ]}
          >
            Collections (Vendors)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typePill, selectedType === 'distribution' && styles.typePillActiveDist]}
          onPress={() => setSelectedType('distribution')}
        >
          <Text
            style={[
              styles.typePillText,
              selectedType === 'distribution' && styles.typePillTextActive,
            ]}
          >
            Distributions (Customers)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Inventory Strip */}
      {summary && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={[styles.summaryVal, { color: Colors.primary }]}>
              {formatLitres(summary.totalCollectionQty)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Distributed</Text>
            <Text style={[styles.summaryVal, { color: Colors.secondary }]}>
              {formatLitres(summary.totalDistributedQtyAll)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryVal,
                { color: summary.remainingLitres >= 0 ? Colors.slate900 : Colors.danger },
              ]}
            >
              {formatLitres(summary.remainingLitres)}
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="water-outline"
              title="No Milk Entries For This Selection"
              message={`No entries recorded for ${formatDate(selectedDate)} (${selectedSession === 'all' ? 'All Sessions' : selectedSession}).`}
              actionTitle="Add New Entry"
              onAction={() => navigation.navigate('AddActivity', {})}
            />
          }
        />
      )}

      {/* Floating Add Entry Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddActivity', {})}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  controlsBar: {
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate100,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  navArrow: {
    padding: 4,
  },
  selectedDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
    marginHorizontal: 4,
  },
  typePillsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  typePillActive: {
    backgroundColor: Colors.slate800,
  },
  typePillActiveColl: {
    backgroundColor: Colors.primary,
  },
  typePillActiveDist: {
    backgroundColor: Colors.secondary,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  typePillTextActive: {
    color: Colors.white,
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
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
    height: 24,
    backgroundColor: Colors.slate200,
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
  activityCard: {
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
  typeIconCircle: {
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    flex: 1,
    marginRight: 6,
  },
  partyMeta: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    color: Colors.slate600,
    fontStyle: 'italic',
    marginTop: 2,
  },
  correctedBadge: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: 2,
  },
  reversedBadge: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
  },
  rateCalculation: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 1,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
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
