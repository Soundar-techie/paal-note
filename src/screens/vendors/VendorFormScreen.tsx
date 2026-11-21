import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { vendorApi } from '../../api/client';
import { useRoute, useNavigation } from '@react-navigation/native';

export const VendorFormScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const existingVendor = route.params?.vendor;
  const isEditing = !!existingVendor;

  const [name, setName] = useState(existingVendor?.name || '');
  const [location, setLocation] = useState(existingVendor?.location || '');
  const [phone, setPhone] = useState(existingVendor?.phone || '');
  const [address, setAddress] = useState(existingVendor?.address || '');
  const [defaultMilkType, setDefaultMilkType] = useState(existingVendor?.defaultMilkType || 'Cow Milk');
  const [defaultRate, setDefaultRate] = useState(String(existingVendor?.defaultRate ?? 42));
  const [advanceBalance, setAdvanceBalance] = useState(String(existingVendor?.advanceBalance ?? 0));
  const [paymentFrequency, setPaymentFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    existingVendor?.paymentFrequency || 'weekly'
  );
  const [payoutCycleDay, setPayoutCycleDay] = useState(existingVendor?.payoutCycleDay || 'Sunday');
  const [payoutCycleDate, setPayoutCycleDate] = useState(String(existingVendor?.payoutCycleDate ?? 1));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};

    // MANDATORY FIELDS
    if (!name.trim()) {
      errs.name = 'Vendor Name is required';
    }
    if (!location.trim()) {
      errs.location = 'Location is required';
    }

    const rateNum = Number(defaultRate);
    if (isNaN(rateNum) || rateNum < 0) {
      errs.defaultRate = 'Enter a valid positive milk rate';
    }

    if (paymentFrequency === 'monthly') {
      const dateNum = Number(payoutCycleDate);
      if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
        errs.payoutCycleDate = 'Enter a valid day of month (1 - 31)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please complete the required fields highlighted in red');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        location: location.trim(),
        phone: phone.trim(),
        address: address.trim(),
        defaultMilkType,
        defaultRate: Number(defaultRate),
        advanceBalance: Number(advanceBalance) || 0,
        paymentFrequency,
      };

      if (paymentFrequency === 'weekly') {
        payload.payoutCycleDay = payoutCycleDay;
      } else if (paymentFrequency === 'monthly') {
        payload.payoutCycleDate = Number(payoutCycleDate) || 1;
      }

      let res;
      if (isEditing) {
        res = await vendorApi.update(existingVendor._id, payload);
      } else {
        res = await vendorApi.create(payload);
      }

      if (res.success) {
        Alert.alert(
          'Success',
          `Vendor ${name} ${isEditing ? 'updated' : 'created'} successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Operation failed');
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
        title={isEditing ? 'Edit Vendor' : 'Add New Vendor'}
        subtitle="Milk Supplier Profile"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Mandatory Information</Text>

          <Input
            label="Vendor / Farmer Name"
            placeholder="e.g. Murugan Dairy"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
            required
            leftIcon="person-outline"
          />

          <Input
            label="Location / Village / Route"
            placeholder="e.g. Green Meadows"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              if (errors.location) setErrors({ ...errors, location: '' });
            }}
            error={errors.location}
            required
            leftIcon="location-outline"
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Contact & Address Details
          </Text>

          <Input
            label="Phone Number"
            placeholder="e.g. 98401 12345"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Address / Street"
            placeholder="e.g. Plot 14, Cow Shelter Street"
            value={address}
            onChangeText={setAddress}
            leftIcon="home-outline"
            multiline
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Milk Supply Settings
          </Text>

          {/* Milk Type Picker Buttons */}
          <Text style={styles.fieldLabel}>Default Milk Type</Text>
          <View style={styles.typeSelectorRow}>
            <Button
              title="Cow Milk"
              variant={defaultMilkType === 'Cow Milk' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginRight: 6 }}
              onPress={() => setDefaultMilkType('Cow Milk')}
            />
            <Button
              title="Buffalo Milk"
              variant={defaultMilkType === 'Buffalo Milk' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() => setDefaultMilkType('Buffalo Milk')}
            />
          </View>

          <Input
            label="Agreed Buy Rate (₹ per Litre)"
            placeholder="42"
            value={defaultRate}
            onChangeText={(text) => {
              setDefaultRate(text);
              if (errors.defaultRate) setErrors({ ...errors, defaultRate: '' });
            }}
            keyboardType="decimal-pad"
            leftIcon="cash-outline"
            error={errors.defaultRate}
          />

          {!isEditing && (
            <Input
              label="Starting Advance Balance (₹)"
              placeholder="0"
              value={advanceBalance}
              onChangeText={setAdvanceBalance}
              keyboardType="decimal-pad"
              leftIcon="wallet-outline"
            />
          )}

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Payment Schedule & Payout Cycle
          </Text>

          <Text style={styles.fieldLabel}>Payment Frequency</Text>
          <View style={styles.typeSelectorRow}>
            <Button
              title="Daily"
              variant={paymentFrequency === 'daily' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginRight: 4 }}
              onPress={() => setPaymentFrequency('daily')}
            />
            <Button
              title="Weekly"
              variant={paymentFrequency === 'weekly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 4 }}
              onPress={() => setPaymentFrequency('weekly')}
            />
            <Button
              title="Monthly"
              variant={paymentFrequency === 'monthly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginLeft: 4 }}
              onPress={() => setPaymentFrequency('monthly')}
            />
          </View>

          {paymentFrequency === 'weekly' && (
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={styles.fieldLabel}>Payout Cycle Day (Weekly Payout On)</Text>
              <View style={styles.daysGrid}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (day) => (
                    <Button
                      key={day}
                      title={day.slice(0, 3)}
                      variant={payoutCycleDay === day ? 'primary' : 'secondary'}
                      size="sm"
                      style={styles.dayBtn}
                      onPress={() => setPayoutCycleDay(day as any)}
                    />
                  )
                )}
              </View>
              <Text style={styles.helperText}>Payouts will settle every {payoutCycleDay}</Text>
            </View>
          )}

          {paymentFrequency === 'monthly' && (
            <View style={{ marginBottom: Spacing.sm }}>
              <Input
                label="Payout Cycle Date (Day of Month: 1 - 31)"
                placeholder="e.g. 1 or 5 or 10"
                value={payoutCycleDate}
                onChangeText={(val) => {
                  setPayoutCycleDate(val);
                  if (errors.payoutCycleDate) setErrors({ ...errors, payoutCycleDate: '' });
                }}
                keyboardType="number-pad"
                leftIcon="calendar-outline"
                error={errors.payoutCycleDate}
              />
              <Text style={styles.helperText}>
                Payouts settle on day {payoutCycleDate || '1'} of every month
              </Text>
            </View>
          )}

          {paymentFrequency === 'daily' && (
            <Text style={[styles.helperText, { marginBottom: Spacing.md }]}>
              Daily settlement: account reconciles at the end of each working day
            </Text>
          )}

          <Button
            title={isEditing ? 'Save Changes' : 'Create Vendor'}
            onPress={handleSubmit}
            loading={loading}
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
  formCard: {
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  dayBtn: {
    minWidth: 44,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
    color: Colors.slate500,
    fontStyle: 'italic',
    marginTop: 2,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
