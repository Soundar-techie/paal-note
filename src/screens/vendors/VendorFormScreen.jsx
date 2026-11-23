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
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { vendorApi } from '../../api/client';
import { useRoute, useNavigation } from '@react-navigation/native';

export const VendorFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const existingVendor = route.params?.vendor;
  const isEditing = Boolean(existingVendor);

  const [name, setName] = useState(existingVendor?.name || '');
  const [location, setLocation] = useState(existingVendor?.location || '');
  const [phone, setPhone] = useState(existingVendor?.phone || '');
  const [address, setAddress] = useState(existingVendor?.address || '');
  const [defaultMilkType, setDefaultMilkType] = useState(existingVendor?.defaultMilkType || 'Cow Milk');
  const [defaultRate, setDefaultRate] = useState(String(existingVendor?.defaultRate ?? 42));
  const [paymentFrequency, setPaymentFrequency] = useState(
    existingVendor?.paymentFrequency || 'weekly'
  );
  const [payoutCycleDay, setPayoutCycleDay] = useState(existingVendor?.payoutCycleDay || 'Sunday');
  const [payoutCycleDate, setPayoutCycleDate] = useState(String(existingVendor?.payoutCycleDate ?? 1));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

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
      const payload = {
        name: name.trim(),
        location: location.trim(),
        phone: phone.trim(),
        address: address.trim(),
        defaultMilkType,
        defaultRate: Number(defaultRate),
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
    } catch (err) {
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
            onChangeText={setDefaultRate}
            keyboardType="decimal-pad"
            leftIcon="pricetag-outline"
            error={errors.defaultRate}
            required
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Payout Settlement Cycle
          </Text>

          <View style={styles.freqRow}>
            <Button
              title="Daily"
              variant={paymentFrequency === 'daily' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('daily')}
            />
            <Button
              title="Weekly"
              variant={paymentFrequency === 'weekly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('weekly')}
            />
            <Button
              title="Monthly"
              variant={paymentFrequency === 'monthly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('monthly')}
            />
          </View>

          {paymentFrequency === 'weekly' && (
            <View style={{ marginTop: Spacing.sm }}>
              <Text style={styles.fieldLabel}>Payout Day of Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayPill,
                        payoutCycleDay === day && styles.dayPillActive,
                      ]}
                      onPress={() => setPayoutCycleDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          payoutCycleDay === day && styles.dayPillTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>
          )}

          {paymentFrequency === 'monthly' && (
            <Input
              label="Monthly Settlement Day (1 - 31)"
              placeholder="e.g. 1"
              value={payoutCycleDate}
              onChangeText={setPayoutCycleDate}
              keyboardType="number-pad"
              leftIcon="calendar-outline"
              error={errors.payoutCycleDate}
            />
          )}

          <Button
            title={isEditing ? 'Update Vendor' : 'Save Vendor Profile'}
            variant="primary"
            icon="save-outline"
            loading={loading}
            onPress={handleSubmit}
            style={{ marginTop: Spacing.lg }}
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
    marginBottom: Spacing.sm,
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
  freqRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.slate100,
    marginRight: 6,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  dayPillTextActive: {
    color: Colors.white,
  },
});
