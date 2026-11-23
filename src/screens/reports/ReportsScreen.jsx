import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { reportApi } from '../../api/client';
import {
  formatCurrency,
  formatLitres,
  formatDate,
  getTodayDateString,
  exportToCSV,
} from '../../utils/formatters';

export const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState('milk');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick preset helper
  const setRangePreset = (daysBack) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'milk') {
        res = await reportApi.getMilkReport({ startDate, endDate });
      } else if (activeTab === 'vendors') {
        res = await reportApi.getPartyReport({ partyType: 'vendor', startDate, endDate });
      } else if (activeTab === 'customers') {
        res = await reportApi.getPartyReport({ partyType: 'customer', startDate, endDate });
      } else if (activeTab === 'buyers') {
        res = await reportApi.getPartyReport({ partyType: 'buyer', startDate, endDate });
      } else if (activeTab === 'income_expense') {
        res = await reportApi.getIncomeExpenseReport({ startDate, endDate });
      } else if (activeTab === 'outstanding') {
        res = await reportApi.getOutstandingReport();
      }

      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      Alert.alert('Report Error', err.message || 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!reportData) return;

    if (activeTab === 'milk') {
      const headers = ['Date', 'Session', 'Type', 'Party Code', 'Party Name', 'Milk Type', 'Quantity (L)', 'Rate (₹)', 'Total Amount (₹)', 'Status'];
      const rows = (reportData.data || []).map((a) => [
        a.date,
        a.session,
        a.type,
        a.partyCode,
        a.partyName,
        a.milkType,
        a.quantityLitres,
        a.ratePerLitre,
        a.totalAmount,
        a.status,
      ]);
      exportToCSV(`Milk_Report_${startDate}_${endDate}`, headers, rows);
    } else if (activeTab === 'vendors') {
      const headers = ['Vendor ID', 'Name', 'Location', 'Phone', 'Period Qty (L)', 'Period Payable (₹)', 'Period Paid (₹)', 'Current Balance (₹)'];
      const rows = (reportData.data || []).map((v) => [
        v.code,
        v.name,
        v.location,
        v.phone || '',
        v.periodQtyLitres,
        v.periodPayable,
        v.periodPaid,
        v.currentBalance,
      ]);
      exportToCSV(`Vendors_Report_${startDate}_${endDate}`, headers, rows);
    } else if (activeTab === 'customers') {
      const headers = ['Customer ID', 'Name', 'Location', 'Phone', 'Period Delivered (L)', 'Period Billed (₹)', 'Period Received (₹)', 'Balance Due (₹)'];
      const rows = (reportData.data || []).map((c) => [
        c.code,
        c.name,
        c.location,
        c.phone || '',
        c.periodQtyLitres,
        c.periodReceivable,
        c.periodReceived,
        c.currentBalance,
      ]);
      exportToCSV(`Customers_Report_${startDate}_${endDate}`, headers, rows);
    } else if (activeTab === 'income_expense') {
      const headers = ['Voucher No', 'Date', 'Type', 'Party', 'Mode', 'Amount (₹)', 'Ref'];
      const rows = (reportData.data || []).map((p) => [
        p.paymentNumber,
        p.date,
        p.paymentType,
        p.partyName,
        p.paymentMode,
        p.amount,
        p.referenceNumber || '',
      ]);
      exportToCSV(`Income_Expense_${startDate}_${endDate}`, headers, rows);
    } else if (activeTab === 'outstanding') {
      const headers = ['Category', 'Code', 'Name', 'Location', 'Outstanding Amount (₹)'];
      const rows = [];
      (reportData.vendors || []).forEach((v) => rows.push(['Vendor Payable', v.vendorId, v.name, v.location, v.balance]));
      (reportData.customers || []).forEach((c) => rows.push(['Customer Receivable', c.customerId, c.name, c.location, c.balance]));
      (reportData.buyers || []).forEach((b) => rows.push(['Buyer Receivable', b.buyerId, b.name, b.location, b.balance]));
      exportToCSV('Outstanding_Balances_Report', headers, rows);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Reports & Analytics"
        subtitle="Audits, Summaries & CSV Exports"
        showBack
        rightAction={{
          icon: 'download-outline',
          onPress: handleExportCSV,
        }}
      />

      {/* Preset Range Bar */}
      <View style={styles.filterBar}>
        <View style={styles.presetButtonsRow}>
          <TouchableOpacity
            style={[styles.presetBtn, startDate === getTodayDateString() && styles.presetBtnActive]}
            onPress={() => setRangePreset(0)}
          >
            <Text style={[styles.presetBtnText, startDate === getTodayDateString() && styles.presetBtnTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setRangePreset(7)}
          >
            <Text style={styles.presetBtnText}>Last 7 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setRangePreset(30)}
          >
            <Text style={styles.presetBtnText}>Last 30 Days</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateRangeDisplay}>
          {formatDate(startDate)} → {formatDate(endDate)}
        </Text>
      </View>

      {/* Report Module Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <TouchableOpacity
          style={[styles.reportTab, activeTab === 'milk' && styles.reportTabActive]}
          onPress={() => setActiveTab('milk')}
        >
          <Ionicons
            name="water"
            size={14}
            color={activeTab === 'milk' ? Colors.white : Colors.primary}
          />
          <Text style={[styles.reportTabText, activeTab === 'milk' && styles.reportTabTextActive]}>
            Daily Milk
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTab, activeTab === 'vendors' && styles.reportTabActive]}
          onPress={() => setActiveTab('vendors')}
        >
          <Ionicons
            name="people"
            size={14}
            color={activeTab === 'vendors' ? Colors.white : Colors.primary}
          />
          <Text style={[styles.reportTabText, activeTab === 'vendors' && styles.reportTabTextActive]}>
            Vendors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTab, activeTab === 'customers' && styles.reportTabActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons
            name="home"
            size={14}
            color={activeTab === 'customers' ? Colors.white : Colors.secondary}
          />
          <Text style={[styles.reportTabText, activeTab === 'customers' && styles.reportTabTextActive]}>
            Customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTab, activeTab === 'income_expense' && styles.reportTabActive]}
          onPress={() => setActiveTab('income_expense')}
        >
          <Ionicons
            name="cash"
            size={14}
            color={activeTab === 'income_expense' ? Colors.white : Colors.accent}
          />
          <Text style={[styles.reportTabText, activeTab === 'income_expense' && styles.reportTabTextActive]}>
            Income & Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTab, activeTab === 'outstanding' && styles.reportTabActive]}
          onPress={() => setActiveTab('outstanding')}
        >
          <Ionicons
            name="wallet"
            size={14}
            color={activeTab === 'outstanding' ? Colors.white : Colors.danger}
          />
          <Text style={[styles.reportTabText, activeTab === 'outstanding' && styles.reportTabTextActive]}>
            Outstanding
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Main Report Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generating report summary...</Text>
          </View>
        ) : reportData ? (
          <>
            {/* 1. Daily Milk Report View */}
            {activeTab === 'milk' && (
              <View>
                <Card style={styles.summaryCard}>
                  <Text style={styles.cardHeaderTitle}>Milk Inventory Summary</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Total Collection</Text>
                      <Text style={[styles.metricVal, { color: Colors.primary }]}>
                        {formatLitres(reportData.summary?.totalCollectionQty)}
                      </Text>
                      <Text style={styles.metricSub}>
                        {formatCurrency(reportData.summary?.totalCollectionAmount)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Total Distributed</Text>
                      <Text style={[styles.metricVal, { color: Colors.secondary }]}>
                        {formatLitres(reportData.summary?.totalDistributedQtyAll)}
                      </Text>
                      <Text style={styles.metricSub}>
                        {formatCurrency(reportData.summary?.totalDistributionAmount)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Remaining Balance</Text>
                      <Text
                        style={[
                          styles.metricVal,
                          {
                            color:
                              reportData.summary?.remainingLitres >= 0
                                ? Colors.slate900
                                : Colors.danger,
                          },
                        ]}
                      >
                        {formatLitres(reportData.summary?.remainingLitres)}
                      </Text>
                    </View>
                  </View>
                </Card>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Detailed Records ({reportData.data?.length || 0})
                  </Text>
                  <TouchableOpacity onPress={handleExportCSV}>
                    <Text style={styles.exportLink}>Export CSV</Text>
                  </TouchableOpacity>
                </View>

                {(reportData.data || []).map((row) => (
                  <View key={row._id} style={styles.reportRowCard}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowDate}>{formatDate(row.date)}</Text>
                      <Text style={styles.rowParty}>
                        {row.partyName} ({row.partyCode})
                      </Text>
                      <Text style={styles.rowMeta}>
                        {row.session} • {row.milkType} • {row.type}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowQty}>{formatLitres(row.quantityLitres)}</Text>
                      <Text style={styles.rowAmount}>{formatCurrency(row.totalAmount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 2. Vendor-Wise Report */}
            {activeTab === 'vendors' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Vendor Ledger Statements</Text>
                  <TouchableOpacity onPress={handleExportCSV}>
                    <Text style={styles.exportLink}>Export CSV</Text>
                  </TouchableOpacity>
                </View>

                {(reportData.data || []).map((v) => (
                  <Card key={v.id} style={styles.partyReportCard}>
                    <View style={styles.partyCardHeader}>
                      <View>
                        <Text style={styles.partyReportName}>{v.name}</Text>
                        <Text style={styles.partyReportCode}>
                          {v.code} • {v.location}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metricLabel}>Balance Payable</Text>
                        <Text
                          style={[
                            styles.balanceVal,
                            { color: v.currentBalance > 0 ? Colors.danger : Colors.success },
                          ]}
                        >
                          {formatCurrency(v.currentBalance)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.partyMetricsRow}>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Period Supplied</Text>
                        <Text style={styles.subColVal}>{formatLitres(v.periodQtyLitres)}</Text>
                      </View>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Period Billed</Text>
                        <Text style={styles.subColVal}>{formatCurrency(v.periodPayable)}</Text>
                      </View>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Period Paid</Text>
                        <Text style={[styles.subColVal, { color: Colors.primary }]}>
                          {formatCurrency(v.periodPaid)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* 3. Customer-Wise Report */}
            {activeTab === 'customers' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Customer Accounts Ledger</Text>
                  <TouchableOpacity onPress={handleExportCSV}>
                    <Text style={styles.exportLink}>Export CSV</Text>
                  </TouchableOpacity>
                </View>

                {(reportData.data || []).map((c) => (
                  <Card key={c.id} style={styles.partyReportCard}>
                    <View style={styles.partyCardHeader}>
                      <View>
                        <Text style={styles.partyReportName}>{c.name}</Text>
                        <Text style={styles.partyReportCode}>
                          {c.code} • {c.location}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metricLabel}>Receivable Due</Text>
                        <Text
                          style={[
                            styles.balanceVal,
                            { color: c.currentBalance > 0 ? Colors.danger : Colors.success },
                          ]}
                        >
                          {formatCurrency(c.currentBalance)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.partyMetricsRow}>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Delivered</Text>
                        <Text style={styles.subColVal}>{formatLitres(c.periodQtyLitres)}</Text>
                      </View>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Billed</Text>
                        <Text style={styles.subColVal}>{formatCurrency(c.periodReceivable)}</Text>
                      </View>
                      <View style={styles.subCol}>
                        <Text style={styles.subColLabel}>Collected</Text>
                        <Text style={[styles.subColVal, { color: Colors.success }]}>
                          {formatCurrency(c.periodReceived)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* 4. Income & Expense Statement */}
            {activeTab === 'income_expense' && (
              <View>
                <Card style={styles.summaryCard}>
                  <Text style={styles.cardHeaderTitle}>Income & Expense Statement</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Total Collections</Text>
                      <Text style={[styles.metricVal, { color: Colors.success }]}>
                        {formatCurrency(reportData.summary?.totalIncome)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Vendor Payouts</Text>
                      <Text style={[styles.metricVal, { color: Colors.danger }]}>
                        {formatCurrency(reportData.summary?.expensePaidToVendors)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Net Cash Margin</Text>
                      <Text
                        style={[
                          styles.metricVal,
                          {
                            color:
                              reportData.summary?.netProfit >= 0
                                ? Colors.success
                                : Colors.danger,
                          },
                        ]}
                      >
                        {formatCurrency(reportData.summary?.netProfit)}
                      </Text>
                    </View>
                  </View>
                </Card>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Transactions ({reportData.data?.length || 0})
                  </Text>
                  <TouchableOpacity onPress={handleExportCSV}>
                    <Text style={styles.exportLink}>Export CSV</Text>
                  </TouchableOpacity>
                </View>

                {(reportData.data || []).map((row) => (
                  <View key={row.id} style={styles.reportRowCard}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowDate}>{formatDate(row.date)}</Text>
                      <Text style={styles.rowParty}>{row.partyName}</Text>
                      <Text style={styles.rowMeta}>
                        {row.paymentNumber} • {row.paymentMode}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text
                        style={[
                          styles.rowAmount,
                          {
                            color:
                              row.paymentType === 'receive'
                                ? Colors.success
                                : Colors.danger,
                          },
                        ]}
                      >
                        {row.paymentType === 'receive' ? '+' : '-'} {formatCurrency(row.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 5. Outstanding Balances */}
            {activeTab === 'outstanding' && (
              <View>
                <Card style={styles.summaryCard}>
                  <Text style={styles.cardHeaderTitle}>Outstanding Balance Sheet</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Customer Receivables</Text>
                      <Text style={[styles.metricVal, { color: Colors.slate800 }]}>
                        {formatCurrency(reportData.summary?.totalReceivableFromCustomers)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Vendor Payables</Text>
                      <Text style={[styles.metricVal, { color: Colors.danger }]}>
                        {formatCurrency(reportData.summary?.totalPayableToVendors)}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Net Outstanding</Text>
                      <Text
                        style={[
                          styles.metricVal,
                          {
                            color:
                              reportData.summary?.netOutstanding >= 0
                                ? Colors.success
                                : Colors.danger,
                          },
                        ]}
                      >
                        {formatCurrency(reportData.summary?.netOutstanding)}
                      </Text>
                    </View>
                  </View>
                </Card>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Suppliers Awaiting Payout</Text>
                </View>
                {(reportData.vendors || []).map((v) => (
                  <View key={v._id} style={styles.reportRowCard}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowParty}>{v.name}</Text>
                      <Text style={styles.rowMeta}>
                        {v.vendorId} • {v.location}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowAmount, { color: Colors.danger }]}>
                        {formatCurrency(v.balance)}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
                  <Text style={styles.sectionTitle}>Customers With Outstanding Due</Text>
                </View>
                {(reportData.customers || []).map((c) => (
                  <View key={c._id} style={styles.reportRowCard}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowParty}>{c.name}</Text>
                      <Text style={styles.rowMeta}>
                        {c.customerId} • {c.location}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowAmount, { color: Colors.slate800 }]}>
                        {formatCurrency(c.balance)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
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
  filterBar: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  presetBtnActive: {
    backgroundColor: Colors.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  presetBtnTextActive: {
    color: Colors.white,
  },
  dateRangeDisplay: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
  },
  tabScroll: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  reportTabActive: {
    backgroundColor: Colors.slate900,
  },
  reportTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
    marginLeft: 5,
  },
  reportTabTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.slate500,
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  metricSub: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
  },
  exportLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  reportRowCard: {
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
  rowLeft: {
    flex: 1,
  },
  rowDate: {
    fontSize: 11,
    color: Colors.slate400,
  },
  rowParty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rowQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  rowAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate900,
    marginTop: 2,
  },
  partyReportCard: {
    backgroundColor: Colors.white,
    marginBottom: 8,
    padding: Spacing.md,
  },
  partyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyReportName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  partyReportCode: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 1,
  },
  balanceVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  partyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: 8,
    marginTop: 8,
  },
  subCol: {
    flex: 1,
  },
  subColLabel: {
    fontSize: 10,
    color: Colors.slate400,
  },
  subColVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 2,
  },
});
