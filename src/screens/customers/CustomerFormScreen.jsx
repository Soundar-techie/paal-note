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
import { customerApi } from '../../api/client';
import { useRoute, useNavigation } from '@react-navigation/native';

export const CustomerFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const existingCustomer = route.params?.customer;
  const isEditing = Boolean(existingCustomer);

  const [name, setName] = useState(existingCustomer?.name || '');
  const [location, setLocation] = useState(existingCustomer?.location || '');
  const [phone, setPhone] = useState(existingCustomer?.phone || '');
  const [address, setAddress] = useState(existingCustomer?.address || '');
  const [defaultMilkType, setDefaultMilkType] = useState(existingCustomer?.defaultMilkType || 'Cow Milk');
  const [dailyMorningQuantity, setDailyMorningQuantity] = useState(
    String(existingCustomer?.dailyMorningQuantity ?? 1)
  );
  const [dailyEveningQuantity, setDailyEveningQuantity] = useState(
    String(existingCustomer?.dailyEveningQuantity ?? 1)
  );
  const [defaultRate, setDefaultRate] = useState(String(existingCustomer?.defaultRate ?? 52));
  const [customerType, setCustomerType] = useState(
    existingCustomer?.customerType || 'daily'
  );
  const [paymentFrequency, setPaymentFrequency] = useState(
    existingCustomer?.paymentFrequency || 'monthly'
  );
  const [payoutCycleDay, setPayoutCycleDay] = useState(existingCustomer?.payoutCycleDay || 'Sunday');
  const [payoutCycleDate, setPayoutCycleDate] = useState(String(existingCustomer?.payoutCycleDate ?? 1));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!name.trim()) {
      errs.name = 'Customer Name is required';
    }
    if (!location.trim()) {
      errs.location = 'Location is required';
    }

    const morningQty = Number(dailyMorningQuantity);
    const eveningQty = Number(dailyEveningQuantity);
    if (isNaN(morningQty) || morningQty < 0) {
      errs.dailyMorningQuantity = 'Enter valid morning quantity';
    }
    if (isNaN(eveningQty) || eveningQty < 0) {
      errs.dailyEveningQuantity = 'Enter valid evening quantity';
    }

    const rateNum = Number(defaultRate);
    if (isNaN(rateNum) || rateNum < 0) {
      errs.defaultRate = 'Enter valid milk rate';
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
        dailyMorningQuantity: Number(dailyMorningQuantity) || 0,
        dailyEveningQuantity: Number(dailyEveningQuantity) || 0,
        defaultRate: Number(defaultRate),
        customerType,
        paymentFrequency,
      };

      if (paymentFrequency === 'weekly') {
        payload.payoutCycleDay = payoutCycleDay;
      } else if (paymentFrequency === 'monthly') {
        payload.payoutCycleDate = Number(payoutCycleDate) || 1;
      }

      let res;
      if (isEditing) {
        res = await customerApi.update(existingCustomer._id, payload);
      } else {
        res = await customerApi.create(payload);
      }

      if (res.success) {
        Alert.alert(
          'Success',
          `Customer ${name} ${isEditing ? 'updated' : 'registered'} successfully!`,
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
        title={isEditing ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Household Delivery Profile"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Mandatory Information</Text>

          <Input
            label="Customer / Family Name"
            placeholder="e.g. Priya Krishnan"
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
            label="Location / Village / Apt"
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
            Contact & Door Details
          </Text>

          <Input
            label="Phone Number"
            placeholder="e.g. 97890 11111"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Delivery Address / Flat No"
            placeholder="e.g. Flat 3B, Sunshine Apts"
            value={address}
            onChangeText={setAddress}
            leftIcon="home-outline"
            multiline
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Daily Delivery Quota (Litres)
          </Text>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Input
                label="☀️ Morning (L)"
                placeholder="1"
                value={dailyMorningQuantity}
                onChangeText={setDailyMorningQuantity}
                keyboardType="decimal-pad"
                error={errors.dailyMorningQuantity}
                required
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Input
                label="🌙 Evening (L)"
                placeholder="1"
                value={dailyEveningQuantity}
                onChangeText={setDailyEveningQuantity}
                keyboardType="decimal-pad"
                error={errors.dailyEveningQuantity}
                required
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Milk Variety</Text>
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
            label="Selling Rate (₹ per Litre)"
            placeholder="52"
            value={defaultRate}
            onChangeText={setDefaultRate}
            keyboardType="decimal-pad"
            leftIcon="pricetag-outline"
            error={errors.defaultRate}
            required
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Payment Settlement Cycle
          </Text>

          <View style={styles.freqRow}>
            <Button
              title="Monthly"
              variant={paymentFrequency === 'monthly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('monthly')}
            />
            <Button
              title="Weekly"
              variant={paymentFrequency === 'weekly' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('weekly')}
            />
            <Button
              title="Daily"
              variant={paymentFrequency === 'daily' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 2 }}
              onPress={() => setPaymentFrequency('daily')}
            />
          </View>

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
            title={isEditing ? 'Update Customer' : 'Save Customer Profile'}
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
  twoColRow: {
    flexDirection: 'row',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  freqRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
});
