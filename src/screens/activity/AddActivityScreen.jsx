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
import { SessionToggle } from '../../components/common/SessionToggle';
import { vendorApi, customerApi, buyerApi, activityApi } from '../../api/client';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { useRoute, useNavigation } from '@react-navigation/native';

export const AddActivityScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const defaultType = route.params?.defaultType || 'collection';
  const initialPartyType = route.params?.partyType || (defaultType === 'collection' ? 'vendor' : 'customer');
  const initialPartyId = route.params?.partyId || '';

  const [date, setDate] = useState(getTodayDateString());
  const [session, setSession] = useState('morning');
  const [type, setType] = useState(defaultType);
  const [partyType, setPartyType] = useState(initialPartyType);

  // Available party list for selection
  const [partyList, setPartyList] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);

  const [milkType, setMilkType] = useState('Cow Milk');
  const [quantityLitres, setQuantityLitres] = useState('10');
  const [ratePerLitre, setRatePerLitre] = useState('42');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch party list whenever partyType changes
  useEffect(() => {
    const loadParties = async () => {
      try {
        if (partyType === 'vendor') {
          const res = await vendorApi.getAll({ status: 'active' });
          if (res.success && res.data) {
            setPartyList(res.data);
            if (initialPartyId) {
              const matched = res.data.find((p) => p._id === initialPartyId);
              if (matched) handleSelectParty(matched);
            } else if (res.data.length > 0) {
              handleSelectParty(res.data[0]);
            }
          }
        } else if (partyType === 'customer') {
          const res = await customerApi.getAll({ status: 'active' });
          if (res.success && res.data) {
            setPartyList(res.data);
            if (initialPartyId) {
              const matched = res.data.find((p) => p._id === initialPartyId);
              if (matched) handleSelectParty(matched);
            } else if (res.data.length > 0) {
              handleSelectParty(res.data[0]);
            }
          }
        } else if (partyType === 'buyer') {
          const res = await buyerApi.getAll({ status: 'active' });
          if (res.success && res.data) {
            setPartyList(res.data);
            if (initialPartyId) {
              const matched = res.data.find((p) => p._id === initialPartyId);
              if (matched) handleSelectParty(matched);
            } else if (res.data.length > 0) {
              handleSelectParty(res.data[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading parties for dropdown:', err);
      }
    };

    loadParties();
  }, [partyType, initialPartyId]);

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    if (party.defaultMilkType) setMilkType(party.defaultMilkType);
    if (party.defaultRate) setRatePerLitre(String(party.defaultRate));

    // For customers, auto-populate the session quota!
    if (partyType === 'customer') {
      const quota =
        session === 'morning'
          ? party.dailyMorningQuantity || 1
          : party.dailyEveningQuantity || 1;
      setQuantityLitres(String(quota));
    }
  };

  const handleActivityTypeChange = (newType) => {
    setType(newType);
    if (newType === 'collection') {
      setPartyType('vendor');
    } else if (newType === 'distribution') {
      setPartyType('customer');
    } else if (newType === 'buyer_sale') {
      setPartyType('buyer');
    }
  };

  // Real-time calculation: Total Amount = Quantity * Rate
  const qtyNum = parseFloat(quantityLitres) || 0;
  const rateNum = parseFloat(ratePerLitre) || 0;
  const calculatedTotal = (qtyNum * rateNum).toFixed(2);

  const validate = () => {
    const errs = {};

    if (!selectedParty) {
      errs.party = 'Please select a vendor or customer';
    }
    if (!quantityLitres || isNaN(qtyNum) || qtyNum <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    }
    if (!ratePerLitre || isNaN(rateNum) || rateNum < 0) {
      errs.rate = 'Rate cannot be negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check the input values');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        session,
        type,
        partyType,
        partyId: selectedParty._id,
        milkType,
        quantityLitres: qtyNum,
        ratePerLitre: rateNum,
        notes: notes.trim(),
      };

      const res = await activityApi.create(payload);
      if (res.success) {
        Alert.alert(
          'Saved Successfully',
          `Recorded ${session} ${type} of ${qtyNum}L for ${selectedParty.name}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save daily activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Record Daily Milk Entry"
        subtitle={`${session.toUpperCase()} • ${type.toUpperCase()}`}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          {/* Activity Category Selector */}
          <Text style={styles.sectionLabel}>Operation Type</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'collection' && { backgroundColor: Colors.primary },
              ]}
              onPress={() => handleActivityTypeChange('collection')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'collection' && styles.typeBtnTextActive,
                ]}
              >
                Collection (Vendor)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'distribution' && { backgroundColor: Colors.secondary },
              ]}
              onPress={() => handleActivityTypeChange('distribution')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'distribution' && styles.typeBtnTextActive,
                ]}
              >
                Distribution (Customer)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'buyer_sale' && { backgroundColor: Colors.accent },
              ]}
              onPress={() => handleActivityTypeChange('buyer_sale')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'buyer_sale' && styles.typeBtnTextActive,
                ]}
              >
                Bulk Sale (Buyer)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Session Selector: Morning vs Evening */}
          <View style={styles.sessionRow}>
            <Text style={styles.sectionLabel}>Session</Text>
            <SessionToggle
              selected={session}
              onSelect={(s) => {
                if (s !== 'all') {
                  setSession(s);
                  if (selectedParty && partyType === 'customer') {
                    const q = s === 'morning' ? selectedParty.dailyMorningQuantity : selectedParty.dailyEveningQuantity;
                    setQuantityLitres(String(q || 1));
                  }
                }
              }}
            />
          </View>

          {/* Date Picker Input */}
          <Input
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            required
          />

          {/* Party Dropdown / Selection Pill List */}
          <Text style={styles.sectionLabel}>
            Select {partyType === 'vendor' ? 'Vendor' : partyType === 'customer' ? 'Customer' : 'Buyer'}
          </Text>

          {partyList.length === 0 ? (
            <Text style={styles.noPartiesText}>No active {partyType}s available.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partyPillScroll}>
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
                        styles.partyPillLoc,
                        isSelected && styles.partyPillTextSelected,
                      ]}
                    >
                      {p.location}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {errors.party && <Text style={styles.errorText}>{errors.party}</Text>}

          {/* Milk Type Buttons */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Milk Type</Text>
          <View style={styles.milkTypeRow}>
            <TouchableOpacity
              style={[styles.milkPill, milkType === 'Cow Milk' && styles.milkPillActive]}
              onPress={() => setMilkType('Cow Milk')}
            >
              <Text
                style={[
                  styles.milkPillText,
                  milkType === 'Cow Milk' && styles.milkPillTextActive,
                ]}
              >
                Cow Milk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.milkPill, milkType === 'Buffalo Milk' && styles.milkPillActive]}
              onPress={() => setMilkType('Buffalo Milk')}
            >
              <Text
                style={[
                  styles.milkPillText,
                  milkType === 'Buffalo Milk' && styles.milkPillTextActive,
                ]}
              >
                Buffalo Milk
              </Text>
            </TouchableOpacity>
          </View>

          {/* Numerical Inputs: Quantity & Rate */}
          <View style={styles.inputsRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Input
                label="Milk Quantity (L)"
                placeholder="0.0"
                value={quantityLitres}
                onChangeText={(text) => {
                  setQuantityLitres(text);
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }}
                keyboardType="decimal-pad"
                leftIcon="water-outline"
                error={errors.quantity}
                required
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Input
                label="Rate (₹ / Litre)"
                placeholder="0.0"
                value={ratePerLitre}
                onChangeText={(text) => {
                  setRatePerLitre(text);
                  if (errors.rate) setErrors({ ...errors, rate: '' });
                }}
                keyboardType="decimal-pad"
                leftIcon="cash-outline"
                error={errors.rate}
                required
              />
            </View>
          </View>

          {/* Auto-Calculated Total Amount Display */}
          <View style={styles.calcTotalBox}>
            <Text style={styles.calcTotalLabel}>Total Amount (Qty × Rate):</Text>
            <Text style={styles.calcTotalVal}>{formatCurrency(Number(calculatedTotal))}</Text>
          </View>

          {/* Notes */}
          <Input
            label="Notes / Comments"
            placeholder="e.g. Extra 2 litres requested, morning batch"
            value={notes}
            onChangeText={setNotes}
            leftIcon="document-text-outline"
          />

          <Button
            title="Save Daily Entry"
            onPress={handleSubmit}
            loading={loading}
            icon="checkmark-circle-outline"
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
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  partyPillScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
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
  partyPillLoc: {
    fontSize: 10,
    color: Colors.slate500,
    marginTop: 2,
  },
  partyPillTextSelected: {
    color: Colors.white,
  },
  noPartiesText: {
    color: Colors.slate400,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  milkTypeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  milkPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  milkPillActive: {
    backgroundColor: Colors.slate800,
  },
  milkPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  milkPillTextActive: {
    color: Colors.white,
  },
  inputsRow: {
    flexDirection: 'row',
  },
  calcTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  calcTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  calcTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
});
