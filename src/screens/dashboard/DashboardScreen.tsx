import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { MilkBarChart } from '../../components/common/MilkBarChart';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/client';
import { DashboardSummary, ChartDayData, DailyActivity, Payment } from '../../types';
import { formatCurrency, formatLitres, formatDate, getTodayDateString } from '../../utils/formatters';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDayData[]>([]);
  const [recentActivities, setRecentActivities] = useState<DailyActivity[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const fetchDashboardData = useCallback(async (date: string) => {
    try {
      const res = await dashboardApi.getSummary(date);
      if (res.success) {
        setSummary(res.summary);
        setChartData(res.chartData || []);
        setRecentActivities(res.recentActivities || []);
        setRecentPayments(res.recentPayments || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate, fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedDate);
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

  const handleSetToday = () => {
    setSelectedDate(getTodayDateString());
  };

  return (
    <View style={styles.container}>
      <Header
        title={user?.organization?.name || 'Paal-Note Dairy'}
        subtitle={`Logged in as ${user?.name}`}
        roleBadge={user?.role}
        rightAction={{
          icon: 'refresh-outline',
          onPress: onRefresh,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date Selector Filter Bar */}
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay}>
            <Ionicons name="chevron-back" size={18} color={Colors.slate700} />
          </TouchableOpacity>

          <View style={styles.dateCenterView}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            {selectedDate !== getTodayDateString() && (
              <TouchableOpacity onPress={handleSetToday} style={styles.todayPill}>
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextDay}>
            <Ionicons name="chevron-forward" size={18} color={Colors.slate700} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading dairy operations summary...</Text>
          </View>
        ) : summary ? (
          <>
            {/* Quick Actions Shortcuts */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: Colors.primary }]}
                onPress={() => navigation.navigate('AddActivity', { defaultType: 'collection' })}
              >
                <Ionicons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.quickActionBtnText}>Add Collection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: Colors.secondary }]}
                onPress={() => navigation.navigate('AddActivity', { defaultType: 'distribution' })}
              >
                <Ionicons name="arrow-forward-circle" size={18} color={Colors.white} />
                <Text style={styles.quickActionBtnText}>Add Distribution</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: Colors.accent }]}
                onPress={() => navigation.navigate('RecordPayment')}
              >
                <Ionicons name="card" size={18} color={Colors.white} />
                <Text style={styles.quickActionBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>

            {/* Core Milk Balance Banner */}
            <Card style={styles.balanceBanner}>
              <View style={styles.bannerHeader}>
                <View>
                  <Text style={styles.bannerTitle}>Daily Milk Inventory</Text>
                  <Text style={styles.bannerSubtitle}>{formatDate(selectedDate)} Status</Text>
                </View>
                <Badge
                  label={summary.remainingMilk >= 0 ? 'In Stock' : 'Deficit'}
                  variant={summary.remainingMilk >= 0 ? 'success' : 'danger'}
                />
              </View>

              <View style={styles.bannerMetricsRow}>
                <View style={styles.bannerCol}>
                  <Text style={styles.metricLabel}>Total Collected</Text>
                  <Text style={[styles.metricVal, { color: Colors.primary }]}>
                    {formatLitres(summary.totalCollected)}
                  </Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerCol}>
                  <Text style={styles.metricLabel}>Total Distributed</Text>
                  <Text style={[styles.metricVal, { color: Colors.secondary }]}>
                    {formatLitres(summary.totalDistributed)}
                  </Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerCol}>
                  <Text style={styles.metricLabel}>Remaining Milk</Text>
                  <Text
                    style={[
                      styles.metricVal,
                      { color: summary.remainingMilk >= 0 ? Colors.slate900 : Colors.danger },
                    ]}
                  >
                    {formatLitres(summary.remainingMilk)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Session Breakdown: Morning ☀️ vs Evening 🌙 */}
            <Text style={styles.sectionHeading}>Session Breakdown</Text>
            <View style={styles.sessionCardsRow}>
              {/* Morning Card */}
              <View style={[styles.sessionCard, { borderColor: Colors.morning }]}>
                <View style={styles.sessionCardHeader}>
                  <Ionicons name="sunny" size={20} color={Colors.morning} />
                  <Text style={[styles.sessionCardTitle, { color: Colors.morning }]}>
                    Morning Session
                  </Text>
                </View>
                <View style={styles.sessionLine}>
                  <Text style={styles.sessionLabel}>Collection:</Text>
                  <Text style={styles.sessionValue}>{formatLitres(summary.morning.collection)}</Text>
                </View>
                <View style={styles.sessionLine}>
                  <Text style={styles.sessionLabel}>Distribution:</Text>
                  <Text style={styles.sessionValue}>{formatLitres(summary.morning.distribution)}</Text>
                </View>
                <View style={[styles.sessionLine, styles.sessionLineBorder]}>
                  <Text style={styles.sessionLabel}>Amount:</Text>
                  <Text style={[styles.sessionValue, { color: Colors.primary }]}>
                    {formatCurrency(summary.morning.collectionAmount)}
                  </Text>
                </View>
              </View>

              {/* Evening Card */}
              <View style={[styles.sessionCard, { borderColor: Colors.evening }]}>
                <View style={styles.sessionCardHeader}>
                  <Ionicons name="moon" size={20} color={Colors.evening} />
                  <Text style={[styles.sessionCardTitle, { color: Colors.evening }]}>
                    Evening Session
                  </Text>
                </View>
                <View style={styles.sessionLine}>
                  <Text style={styles.sessionLabel}>Collection:</Text>
                  <Text style={styles.sessionValue}>{formatLitres(summary.evening.collection)}</Text>
                </View>
                <View style={styles.sessionLine}>
                  <Text style={styles.sessionLabel}>Distribution:</Text>
                  <Text style={styles.sessionValue}>{formatLitres(summary.evening.distribution)}</Text>
                </View>
                <View style={[styles.sessionLine, styles.sessionLineBorder]}>
                  <Text style={styles.sessionLabel}>Amount:</Text>
                  <Text style={[styles.sessionValue, { color: Colors.primary }]}>
                    {formatCurrency(summary.evening.collectionAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 7-Day Trend Chart */}
            <Text style={styles.sectionHeading}>7-Day Milk Flow Trend</Text>
            <MilkBarChart data={chartData} />

            {/* Stakeholders & Operations Grid */}
            <Text style={styles.sectionHeading}>Active Directory</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Vendors"
                value={summary.counts.vendors}
                subtitle="Milk Suppliers"
                icon="people-outline"
                color={Colors.primary}
                bgLight={Colors.primaryLight}
                onPress={() => navigation.navigate('Vendors')}
              />
              <StatCard
                title="Customers"
                value={summary.counts.customers}
                subtitle="Daily Receivers"
                icon="home-outline"
                color={Colors.secondary}
                bgLight={Colors.secondaryLight}
                onPress={() => navigation.navigate('Customers')}
              />
              <StatCard
                title="Bulk Buyers"
                value={summary.counts.buyers}
                subtitle="Commercial Sales"
                icon="business-outline"
                color={Colors.accent}
                bgLight={Colors.accentLight}
                onPress={() => navigation.navigate('Buyers')}
              />
            </View>

            {/* Financial Overview & Balances */}
            <Text style={styles.sectionHeading}>Financial Overview</Text>
            <Card style={styles.financialCard}>
              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Today's Receipts</Text>
                  <Text style={[styles.financialVal, { color: Colors.success }]}>
                    {formatCurrency(summary.financials.dailyIncome)}
                  </Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Today's Payouts</Text>
                  <Text style={[styles.financialVal, { color: Colors.danger }]}>
                    {formatCurrency(summary.financials.dailyExpense)}
                  </Text>
                </View>
              </View>

              <View style={styles.financialDivider} />

              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Customer Receivables</Text>
                  <Text style={[styles.financialVal, { color: Colors.slate800 }]}>
                    {formatCurrency(summary.financials.customerReceivableOutstanding)}
                  </Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Vendor Payables</Text>
                  <Text style={[styles.financialVal, { color: Colors.danger }]}>
                    {formatCurrency(summary.financials.vendorPayableOutstanding)}
                  </Text>
                </View>
              </View>

              <View style={styles.netBalanceBanner}>
                <Text style={styles.netBalanceLabel}>Net Outstanding Receivable:</Text>
                <Text
                  style={[
                    styles.netBalanceVal,
                    {
                      color:
                        summary.financials.netReceivable >= 0
                          ? Colors.success
                          : Colors.danger,
                    },
                  ]}
                >
                  {formatCurrency(summary.financials.netReceivable)}
                </Text>
              </View>
            </Card>

            {/* Recent Daily Activities */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recent Activities</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Daily Activity')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentActivities.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>No activities recorded for today yet.</Text>
              </Card>
            ) : (
              recentActivities.slice(0, 5).map((act) => (
                <TouchableOpacity
                  key={act._id}
                  style={styles.activityItemCard}
                  onPress={() => navigation.navigate('ActivityDetail', { id: act._id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIconCircle,
                        {
                          backgroundColor:
                            act.type === 'collection'
                              ? Colors.primaryLight
                              : Colors.secondaryLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={act.type === 'collection' ? 'arrow-down' : 'arrow-up'}
                        size={18}
                        color={act.type === 'collection' ? Colors.primary : Colors.secondary}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityPartyName}>{act.partyName}</Text>
                      <Text style={styles.activityMeta}>
                        {act.partyCode} • {act.partyLocation} • {act.milkType}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activityRight}>
                    <Text style={styles.activityQty}>{formatLitres(act.quantityLitres)}</Text>
                    <Text style={styles.activityAmount}>{formatCurrency(act.totalAmount)}</Text>
                    <Badge label={act.session} variant={act.session} size="sm" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : null}
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
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.slate500,
    fontSize: 14,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  dateNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.slate100,
  },
  dateCenterView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  todayPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  todayPillText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    marginHorizontal: 3,
    ...Shadows.sm,
  },
  quickActionBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  balanceBanner: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
  },
  bannerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.xs,
  },
  bannerCol: {
    alignItems: 'center',
    flex: 1,
  },
  bannerDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.slate200,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 4,
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sessionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: 3,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  sessionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionLineBorder: {
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  sessionLabel: {
    fontSize: 11,
    color: Colors.slate500,
  },
  sessionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  financialCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 2,
  },
  financialVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  financialDivider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: Spacing.md,
  },
  netBalanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  netBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  netBalanceVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.slate500,
    fontSize: 13,
    paddingVertical: 12,
  },
  activityItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityPartyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  activityMeta: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  activityQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  activityAmount: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 3,
  },
});
