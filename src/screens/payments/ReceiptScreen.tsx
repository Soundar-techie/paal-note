import React, { useState, useEffect } from 'react';
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
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { paymentApi } from '../../api/client';
import { Payment } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const ReceiptScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id } = route.params;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await paymentApi.getReceipt(id);
        if (res.success) {
          setPayment(res.data.payment);
          setParty(res.data.party);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load payment receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    Alert.alert('Digital Receipt', `Receipt #${payment?.paymentNumber} ready for printing or SMS/WhatsApp dispatch.`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.container}>
        <Header title="Payment Receipt" showBack />
        <View style={styles.centerContainer}>
          <Text>Receipt not found</Text>
        </View>
      </View>
    );
  }

  const isPayout = payment.paymentType === 'pay';

  return (
    <View style={styles.container}>
      <Header
        title="Payment Voucher"
        subtitle={payment.paymentNumber}
        showBack
        rightAction={{
          icon: 'share-social-outline',
          onPress: handlePrint,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Printable Receipt Card */}
        <Card style={styles.receiptCard}>
          {/* Top Brand Banner */}
          <View style={styles.brandSection}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="water" size={26} color={Colors.white} />
            </View>
            <Text style={styles.receiptFarmName}>
              {user?.organization?.name || 'Paal-Note Dairy Farm'}
            </Text>
            <Text style={styles.receiptTagline}>Daily Milk & Financial Settlement Voucher</Text>
            <View style={styles.statusBadgeRow}>
              <Badge
                label={isPayout ? 'PAYMENT VOUCHER (EXPENSE)' : 'OFFICIAL MONEY RECEIPT (INCOME)'}
                variant={isPayout ? 'danger' : 'success'}
                size="md"
              />
            </View>
          </View>

          <View style={styles.receiptDottedDivider} />

          {/* Voucher Info */}
          <View style={styles.voucherMetaRow}>
            <View>
              <Text style={styles.metaLabel}>Voucher Number</Text>
              <Text style={styles.metaValue}>{payment.paymentNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Date of Payment</Text>
              <Text style={styles.metaValue}>{formatDate(payment.date)}</Text>
            </View>
          </View>

          {/* Amount Box */}
          <View style={styles.amountHeroBox}>
            <Text style={styles.amountHeroLabel}>
              {isPayout ? 'Total Paid to Supplier' : 'Total Amount Collected'}
            </Text>
            <Text
              style={[
                styles.amountHeroVal,
                { color: isPayout ? Colors.danger : Colors.primary },
              ]}
            >
              {formatCurrency(payment.amount)}
            </Text>
            <Text style={styles.amountInWords}>
              Mode: {payment.paymentMode.toUpperCase()}
              {payment.referenceNumber ? ` • Ref: ${payment.referenceNumber}` : ''}
            </Text>
          </View>

          {/* Party Details Section */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>Stakeholder Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Party Name:</Text>
              <Text style={styles.detailValBold}>{payment.partyName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Account Code:</Text>
              <Text style={styles.detailVal}>{payment.partyCode}</Text>
            </View>
            {party?.location ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailKey}>Location:</Text>
                <Text style={styles.detailVal}>{party.location}</Text>
              </View>
            ) : null}
            {party?.phone ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailKey}>Contact Phone:</Text>
                <Text style={styles.detailVal}>{party.phone}</Text>
              </View>
            ) : null}
            {party?.currentBalance !== undefined ? (
              <View style={[styles.detailItem, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.slate100 }]}>
                <Text style={styles.detailKey}>Remaining Ledger Balance:</Text>
                <Text
                  style={[
                    styles.detailValBold,
                    { color: party.currentBalance > 0 ? Colors.danger : Colors.success },
                  ]}
                >
                  {formatCurrency(party.currentBalance)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Authorizer & Stamp */}
          <View style={styles.signatureRow}>
            <View style={styles.signBox}>
              <Text style={styles.signLabel}>Issued By:</Text>
              <Text style={styles.signName}>{payment.createdByName}</Text>
              <Text style={styles.signTime}>{formatDateTime(payment.createdAt)}</Text>
            </View>
            <View style={styles.verifiedStamp}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.verifiedText}>SYSTEM VERIFIED</Text>
            </View>
          </View>
        </Card>

        {/* Buttons */}
        <View style={styles.actionsBottomRow}>
          <Button
            title="Share / Send Receipt"
            icon="share-outline"
            variant="primary"
            onPress={handlePrint}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button
            title="Done"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  receiptFarmName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
  },
  receiptTagline: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  statusBadgeRow: {
    marginTop: 10,
  },
  receiptDottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.slate200,
    marginVertical: Spacing.md,
  },
  voucherMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.slate400,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 2,
  },
  amountHeroBox: {
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  amountHeroLabel: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountHeroVal: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  amountInWords: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '600',
  },
  sectionBox: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate400,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 13,
    color: Colors.slate500,
  },
  detailVal: {
    fontSize: 13,
    color: Colors.slate800,
  },
  detailValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  signBox: {
    flex: 1,
  },
  signLabel: {
    fontSize: 11,
    color: Colors.slate400,
  },
  signName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
    marginTop: 2,
  },
  signTime: {
    fontSize: 10,
    color: Colors.slate400,
    marginTop: 2,
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    marginLeft: 4,
  },
  actionsBottomRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
});
