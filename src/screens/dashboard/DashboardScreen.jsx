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
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { MilkBarChart } from '../../components/common/MilkBarChart';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/client';
import { formatCurrency, formatLitres, formatDate, getTodayDateString } from '../../utils/formatters';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const fetchDashboardData = useCallback(async (date) => {
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
                title="Active Vendors"
                value={summary.counts.vendors}
                subtitle="Milk suppliers"
                icon="people"
                color={Colors.primary}
                bgLight={Colors.primaryLight}
                onPress={() => navigation.navigate('Vendors')}
              />
              <StatCard
                title="Active Customers"
                value={summary.counts.customers}
                subtitle="Daily households"
                icon="home"
                color={Colors.secondary}
                bgLight={Colors.secondaryLight}
                onPress={() => navigation.navigate('Customers')}
              />
              <StatCard
                title="Commercial Buyers"
                value={summary.counts.buyers}
                subtitle="Bulk purchasers"
                icon="business"
                color={Colors.accent}
                bgLight={Colors.accentLight}
                onPress={() => navigation.navigate('Buyers')}
              />
              <StatCard
                title="Bulk Sold"
                value={formatLitres(summary.buyerSales.quantity)}
                subtitle={formatCurrency(summary.buyerSales.amount)}
                icon="cart"
                color="#8B5CF6"
                bgLight="#EDE9FE"
                onPress={() => navigation.navigate('Buyers')}
              />
            </View>

            {/* Financial Health Summary */}
            <Text style={styles.sectionHeading}>Financial Summary</Text>
            <Card style={styles.financeCard}>
              <View style={styles.financeRow}>
                <View style={styles.financeItem}>
                  <Text style={styles.financeLabel}>Today Cash Collected</Text>
                  <Text style={[styles.financeVal, { color: Colors.success }]}>
                    {formatCurrency(summary.financials.dailyIncome)}
                  </Text>
                </View>
                <View style={styles.financeDivider} />
                <View style={styles.financeItem}>
                  <Text style={styles.financeLabel}>Today Payouts</Text>
                  <Text style={[styles.financeVal, { color: Colors.danger }]}>
                    {formatCurrency(summary.financials.dailyExpense)}
                  </Text>
                </View>
              </View>

              <View style={styles.financeBottomRow}>
                <View style={styles.financeSubItem}>
                  <Text style={styles.financeSubLabel}>Vendor Payables Due:</Text>
                  <Text style={[styles.financeSubVal, { color: Colors.danger }]}>
                    {formatCurrency(summary.financials.vendorPayableOutstanding)}
                  </Text>
                </View>
                <View style={styles.financeSubItem}>
                  <Text style={styles.financeSubLabel}>Customer Receivables Due:</Text>
                  <Text style={[styles.financeSubVal, { color: Colors.success }]}>
                    {formatCurrency(summary.financials.customerReceivableOutstanding)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Recent Daily Activity Log */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recent Milk Records</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Daily Activity')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentActivities.length === 0 ? (
              <Card style={{ padding: Spacing.lg, alignItems: 'center' }}>
                <Text style={{ color: Colors.slate500 }}>No entries logged yet today</Text>
              </Card>
            ) : (
              recentActivities.map((act) => (
                <TouchableOpacity
                  key={act._id}
                  style={styles.recentItemCard}
                  onPress={() => navigation.navigate('ActivityDetail', { id: act._id })}
                >
                  <View style={styles.recentLeft}>
                    <View
                      style={[
                        styles.recentIcon,
                        {
                          backgroundColor:
                            act.type === 'collection' ? Colors.primaryLight : Colors.secondaryLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={act.type === 'collection' ? 'arrow-down' : 'arrow-up'}
                        size={16}
                        color={act.type === 'collection' ? Colors.primary : Colors.secondary}
                      />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.recentPartyName}>{act.partyName}</Text>
                      <Text style={styles.recentMeta}>
                        {act.session} • {act.milkType} • {formatDate(act.date)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.recentQty}>{formatLitres(act.quantityLitres)}</Text>
                    <Text style={styles.recentAmount}>{formatCurrency(act.totalAmount)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Recent Payments Log */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recent Payments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PaymentList')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentPayments.length === 0 ? (
              <Card style={{ padding: Spacing.lg, alignItems: 'center' }}>
                <Text style={{ color: Colors.slate500 }}>No payments recorded yet</Text>
              </Card>
            ) : (
              recentPayments.map((pay) => (
                <TouchableOpacity
                  key={pay._id}
                  style={styles.recentItemCard}
                  onPress={() => navigation.navigate('Receipt', { id: pay._id })}
                >
                  <View style={styles.recentLeft}>
                    <View
                      style={[
                        styles.recentIcon,
                        {
                          backgroundColor:
                            pay.paymentType === 'pay' ? Colors.dangerLight : Colors.successLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={pay.paymentType === 'pay' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={pay.paymentType === 'pay' ? Colors.danger : Colors.success}
                      />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.recentPartyName}>{pay.partyName}</Text>
                      <Text style={styles.recentMeta}>
                        {pay.paymentMode} • {pay.paymentNumber}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.recentAmount,
                        { color: pay.paymentType === 'pay' ? Colors.danger : Colors.success },
                      ]}
                    >
                      {pay.paymentType === 'pay' ? '-' : '+'} {formatCurrency(pay.amount)}
                    </Text>
                    <Text style={styles.recentDate}>{formatDate(pay.date)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Could not load dashboard data</Text>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  dateNavBtn: {
    padding: Spacing.xs,
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
    marginLeft: 8,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    borderRadius: BorderRadius.md,
    marginHorizontal: 3,
    ...Shadows.sm,
  },
  quickActionBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  balanceBanner: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  bannerCol: {
    flex: 1,
    alignItems: 'center',
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
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate800,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginHorizontal: 4,
    ...Shadows.sm,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  sessionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  sessionLineBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    marginTop: 4,
    paddingTop: 4,
  },
  sessionLabel: {
    fontSize: 12,
    color: Colors.slate500,
  },
  sessionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  financeCard: {
    marginBottom: Spacing.md,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.slate100,
  },
  financeLabel: {
    fontSize: 12,
    color: Colors.slate500,
    marginBottom: 4,
  },
  financeVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  financeBottomRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: Spacing.sm,
  },
  financeSubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  financeSubLabel: {
    fontSize: 12,
    color: Colors.slate600,
  },
  financeSubVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  recentItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentPartyName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  recentMeta: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 1,
  },
  recentQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
  },
  recentAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 1,
  },
  recentDate: {
    fontSize: 10,
    color: Colors.slate400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.slate500,
    fontSize: 13,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
  },
});
