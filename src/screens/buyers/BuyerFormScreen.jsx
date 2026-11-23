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
import { buyerApi } from '../../api/client';
import { useRoute, useNavigation } from '@react-navigation/native';

export const BuyerFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const existingBuyer = route.params?.buyer;
  const isEditing = !!existingBuyer;

  const [name, setName] = useState(existingBuyer?.name || '');
  const [businessName, setBusinessName] = useState(existingBuyer?.businessName || '');
  const [location, setLocation] = useState(existingBuyer?.location || '');
  const [phone, setPhone] = useState(existingBuyer?.phone || '');
  const [address, setAddress] = useState(existingBuyer?.address || '');
  const [defaultMilkType, setDefaultMilkType] = useState(existingBuyer?.defaultMilkType || 'Cow Milk');
  const [defaultRate, setDefaultRate] = useState(String(existingBuyer?.defaultRate ?? 50));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!name.trim()) {
      errs.name = 'Contact person / Buyer name is required';
    }
    if (!location.trim()) {
      errs.location = 'Location is required';
    }

    const rateNum = Number(defaultRate);
    if (isNaN(rateNum) || rateNum < 0) {
      errs.defaultRate = 'Enter valid milk rate';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please complete the required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        businessName: businessName.trim(),
        location: location.trim(),
        phone: phone.trim(),
        address: address.trim(),
        defaultMilkType,
        defaultRate: Number(defaultRate),
      };

      let res;
      if (isEditing) {
        res = await buyerApi.update(existingBuyer._id, payload);
      } else {
        res = await buyerApi.create(payload);
      }

      if (res.success) {
        Alert.alert(
          'Success',
          `Buyer ${name} ${isEditing ? 'updated' : 'created'} successfully!`,
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
        title={isEditing ? 'Edit Buyer' : 'Add New Buyer'}
        subtitle="Bulk Milk Purchaser Profile"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Buyer Information</Text>

          <Input
            label="Contact Person Name"
            placeholder="e.g. Sri Krishna Sweets"
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
            label="Business / Sweet Stall Name"
            placeholder="e.g. Krishna Sweets & Bakery"
            value={businessName}
            onChangeText={setBusinessName}
            leftIcon="business-outline"
          />

          <Input
            label="Location / Town"
            placeholder="e.g. Lake View"
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
            Contact Details
          </Text>

          <Input
            label="Phone Number"
            placeholder="e.g. 98840 99901"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Store Address"
            placeholder="e.g. Commercial Street, Lake View"
            value={address}
            onChangeText={setAddress}
            leftIcon="home-outline"
            multiline
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
            Purchase Pricing
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
            label="Bulk Rate (₹ per Litre)"
            placeholder="50"
            value={defaultRate}
            onChangeText={(text) => {
              setDefaultRate(text);
              if (errors.defaultRate) setErrors({ ...errors, defaultRate: '' });
            }}
            keyboardType="decimal-pad"
            leftIcon="cash-outline"
            error={errors.defaultRate}
          />

          <Button
            title={isEditing ? 'Save Changes' : 'Create Buyer'}
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
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
