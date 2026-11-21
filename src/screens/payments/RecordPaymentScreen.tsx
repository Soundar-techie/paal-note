import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { vendorApi, customerApi, buyerApi, paymentApi } from '../../api/client';
import { PaymentPartyType, PaymentMode } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { useRoute, useNavigation } from '@react-navigation/native';

export const RecordPaymentScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const initialPartyType: PaymentPartyType = route.params?.partyType || 'vendor';
  const initialPartyId: string = route.params?.partyId || '';

  const [date, setDate] = useState<string>(getTodayDateString());
  const [partyType, setPartyType] = useState<PaymentPartyType>(initialPartyType);
  const [partyList, setPartyList] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);

  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadParties = async () => {
      try {
        let res;
        if (partyType === 'vendor') res = await vendorApi.getAll({ status: 'active' });
        else if (partyType === 'customer') res = await customerApi.getAll({ status: 'active' });
        else res = await buyerApi.getAll({ status: 'active' });

        if (res.success && res.data) {
          setPartyList(res.data);
          if (initialPartyId) {
            const matched = res.data.find((p: any) => p._id === initialPartyId);
            if (matched) {
              setSelectedParty(matched);
              if (matched.balance > 0) setAmount(String(matched.balance));
            }
          } else if (res.data.length > 0) {
            setSelectedParty(res.data[0]);
            if (res.data[0].balance > 0) setAmount(String(res.data[0].balance));
          }
        }
      } catch (err) {
        console.error('Error loading parties for payment:', err);
      }
    };

    loadParties();
  }, [partyType, initialPartyId]);

  const handleSelectParty = (party: any) => {
    setSelectedParty(party);
    if (party.balance > 0) {
      setAmount(String(party.balance));
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!selectedParty) {
      errs.party = 'Please select a party';
    }

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      errs.amount = 'Amount must be greater than zero';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please complete the required payment details');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        partyType,
        partyId: selectedParty._id,
        amount: parseFloat(amount),
        paymentMode,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      };

      const res = await paymentApi.record(payload);
      if (res.success) {
        Alert.alert(
          'Payment Recorded',
          `Successfully saved ${res.data.paymentNumber}`,
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.replace('Receipt', { id: res.data._id }),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment recording failed');
    } finally {
      setLoading(false);
    }
  };

  const isVendor = partyType === 'vendor';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={isVendor ? 'Vendor Payment (Payout)' : 'Collect Payment (Receipt)'}
        subtitle="Financial Transaction Entry"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          {/* Party Type Switcher */}
          <Text style={styles.sectionLabel}>Transaction Category</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                partyType === 'vendor' && { backgroundColor: Colors.danger },
              ]}
              onPress={() => setPartyType('vendor')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  partyType === 'vendor' && styles.typeBtnTextActive,
                ]}
              >
                Pay Vendor (Supplier)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                partyType === 'customer' && { backgroundColor: Colors.success },
              ]}
              onPress={() => setPartyType('customer')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  partyType === 'customer' && styles.typeBtnTextActive,
                ]}
              >
                From Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                partyType === 'buyer' && { backgroundColor: Colors.accent },
              ]}
              onPress={() => setPartyType('buyer')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  partyType === 'buyer' && styles.typeBtnTextActive,
                ]}
              >
                From Bulk Buyer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Party Selection Scroll */}
          <Text style={styles.sectionLabel}>Select {partyType.toUpperCase()}</Text>
          {partyList.length === 0 ? (
            <Text style={styles.emptyPartyText}>No active {partyType} records.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partyScroll}>
              {partyList.map((p) => {
                const isSelected = selectedParty?._id === p._id;
                return (
                  <TouchableOpacity
                    key={p._id}
                    style={[
                      styles.partyPill,
                      isSelected && styles.partyPillSelected,
                    ]}
                    onPress={() => handleSelectParty(p)}
                  >
                    <Text
                      style={[
                        styles.partyPillName,
                        isSelected && styles.partyPillTextSelected,
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[
                        styles.partyPillBalance,
                        isSelected && styles.partyPillTextSelected,
                      ]}
                    >
                      Due: {formatCurrency(p.balance)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedParty && (
            <View style={styles.selectedPartyBanner}>
              <View>
                <Text style={styles.selectedPartyName}>{selectedParty.name}</Text>
                <Text style={styles.selectedPartySub}>
                  {selectedParty.location} • {selectedParty.phone || 'No phone'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.dueLabel}>Current Balance</Text>
                <Text
                  style={[
                    styles.dueVal,
                    { color: selectedParty.balance > 0 ? Colors.danger : Colors.success },
                  ]}
                >
                  {formatCurrency(selectedParty.balance)}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Date */}
          <Input
            label="Payment Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            required
          />

          {/* Amount */}
          <Input
            label={`Payment Amount (${isVendor ? 'Payout ₹' : 'Collection ₹'})`}
            placeholder="0.00"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            keyboardType="decimal-pad"
            leftIcon="cash-outline"
            error={errors.amount}
            required
          />

          {/* Payment Mode Selector */}
          <Text style={styles.sectionLabel}>Payment Mode</Text>
          <View style={styles.modeRow}>
            {(['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as PaymentMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modePill,
                  paymentMode === mode && styles.modePillActive,
                ]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text
                  style={[
                    styles.modePillText,
                    paymentMode === mode && styles.modePillTextActive,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reference / UTR Number */}
          <Input
            label="Transaction Reference / UTR Number"
            placeholder={paymentMode === 'UPI' ? 'e.g. UPI/2026/8837192' : 'e.g. NEFT12984920'}
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            leftIcon="receipt-outline"
          />

          {/* Notes */}
          <Input
            label="Payment Notes"
            placeholder="e.g. Cleared pending weekly balance"
            value={notes}
            onChangeText={setNotes}
            leftIcon="document-text-outline"
          />

          <Button
            title={isVendor ? 'Confirm & Pay Vendor' : 'Confirm & Issue Receipt'}
            onPress={handleSubmit}
            loading={loading}
            icon="checkmark-done-circle-outline"
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: Colors.white,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
    textAlign: 'center',
  },
  typeBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  partyScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  partyPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  partyPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  partyPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
  },
  partyPillBalance: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  partyPillTextSelected: {
    color: Colors.white,
  },
  emptyPartyText: {
    color: Colors.slate400,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  selectedPartyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPartyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  selectedPartySub: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  dueLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.slate100,
    marginHorizontal: 3,
  },
  modePillActive: {
    backgroundColor: Colors.slate800,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  modePillTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
