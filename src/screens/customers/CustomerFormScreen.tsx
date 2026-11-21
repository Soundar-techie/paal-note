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

export const CustomerFormScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const existingCustomer = route.params?.customer;
  const isEditing = !!existingCustomer;

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
  const [customerType, setCustomerType] = useState<'daily' | 'occasional' | 'seasonal'>(
    existingCustomer?.customerType || 'daily'
  );
  const [paymentFrequency, setPaymentFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    existingCustomer?.paymentFrequency || 'monthly'
  );
  const [payoutCycleDay, setPayoutCycleDay] = useState(existingCustomer?.payoutCycleDay || 'Sunday');
  const [payoutCycleDate, setPayoutCycleDate] = useState(String(existingCustomer?.payoutCycleDate ?? 1));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};

    // MANDATORY FIELDS
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
      const payload: any = {
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
          `Customer ${name} ${isEditing ? 'updated' : 'created'} successfully!`,
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
        title={isEditing ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Household Milk Distribution Profile"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Mandatory Information</Text>

          <Input
            label="Customer Name"
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
            label="Location / Village / Street"
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
            placeholder="e.g. 97890 11111"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Address / Door Number"
            placeholder="e.g. Flat 3B, Sunshine Apts"
            value={address}
            onChangeText={setAddress}
            leftIcon="home-outline"
            multiline
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Daily Delivery Quota
          </Text>

          <View style={styles.quotaInputsRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Input
                label="☀️ Morning (Litres)"
                placeholder="1"
                value={dailyMorningQuantity}
                onChangeText={(text) => {
                  setDailyMorningQuantity(text);
                  if (errors.dailyMorningQuantity)
                    setErrors({ ...errors, dailyMorningQuantity: '' });
                }}
                keyboardType="decimal-pad"
                error={errors.dailyMorningQuantity}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Input
                label="🌙 Evening (Litres)"
                placeholder="1"
                value={dailyEveningQuantity}
                onChangeText={(text) => {
                  setDailyEveningQuantity(text);
                  if (errors.dailyEveningQuantity)
                    setErrors({ ...errors, dailyEveningQuantity: '' });
                }}
                keyboardType="decimal-pad"
                error={errors.dailyEveningQuantity}
              />
            </View>
          </View>

          {/* Milk Type Picker Buttons */}
          <Text style={styles.fieldLabel}>Milk Type</Text>
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
            onChangeText={(text) => {
              setDefaultRate(text);
              if (errors.defaultRate) setErrors({ ...errors, defaultRate: '' });
            }}
            keyboardType="decimal-pad"
            leftIcon="cash-outline"
            error={errors.defaultRate}
          />

          {/* Customer Type Selector */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Customer Classification
          </Text>

          <Text style={styles.fieldLabel}>Customer Type</Text>
          <View style={styles.typeSelectorRow}>
            <Button
              title="Daily Regular"
              variant={customerType === 'daily' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginRight: 4 }}
              onPress={() => setCustomerType('daily')}
            />
            <Button
              title="Occasional"
              variant={customerType === 'occasional' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginHorizontal: 4 }}
              onPress={() => setCustomerType('occasional')}
            />
            <Button
              title="Seasonal"
              variant={customerType === 'seasonal' ? 'primary' : 'secondary'}
              size="sm"
              style={{ flex: 1, marginLeft: 4 }}
              onPress={() => setCustomerType('seasonal')}
            />
          </View>
          <Text style={[styles.helperText, { marginBottom: Spacing.md }]}>
            {customerType === 'daily'
              ? 'Regular daily household distribution'
              : customerType === 'occasional'
              ? 'Purchases intermittently / on-demand'
              : 'Seasonal / festival period bulk deliveries'}
          </Text>

          {/* Payment Schedule & Cycle */}
          <Text style={styles.sectionTitle}>
            Billing & Payment Schedule
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
              <Text style={styles.fieldLabel}>Billing Cycle Day (Weekly Bill Settle Day)</Text>
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
              <Text style={styles.helperText}>Bill settles every {payoutCycleDay}</Text>
            </View>
          )}

          {paymentFrequency === 'monthly' && (
            <View style={{ marginBottom: Spacing.sm }}>
              <Input
                label="Billing Cycle Date (Day of Month: 1 - 31)"
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
                Billing statement generates on day {payoutCycleDate || '1'} of every month
              </Text>
            </View>
          )}

          {paymentFrequency === 'daily' && (
            <Text style={[styles.helperText, { marginBottom: Spacing.md }]}>
              Daily cash/UPI collection upon morning/evening milk delivery
            </Text>
          )}

          <Button
            title={isEditing ? 'Save Changes' : 'Create Customer'}
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
  quotaInputsRow: {
    flexDirection: 'row',
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
