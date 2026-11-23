import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { resetLocalDatabase } from '../../api/client';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('superadmin@paalnote.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      setLoading(false);

      if (!res.success) {
        Alert.alert('Login Failed', res.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Login Error', err.message || 'An error occurred during sign in');
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all milk activities, vendors, customers, buyers, and payments to the default sample dataset. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetLocalDatabase();
              setEmail('superadmin@paalnote.com');
              setPassword('admin123');
              Alert.alert('Success', 'Local database has been re-seeded with fresh demo data!');
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to reset data');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="water" size={42} color={Colors.white} />
          </View>
          <Text style={styles.brandTitle}>Paal-Note</Text>
          <Text style={styles.brandSubtitle}>Daily Milk Management System</Text>

          {/* Morning / Evening / Payments Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.featureBadge}>
              <Ionicons name="sunny" size={12} color={Colors.morning} />
              <Text style={styles.featureBadgeText}>Morning</Text>
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="moon" size={12} color={Colors.evening} />
              <Text style={styles.featureBadgeText}>Evening</Text>
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="cash-outline" size={12} color={Colors.primary} />
              <Text style={styles.featureBadgeText}>Payments</Text>
            </View>
          </View>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to access your dairy management platform</Text>

          <Input
            label="Email Address"
            placeholder="e.g. admin@paalnote.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            required
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
            required
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
            icon="log-in-outline"
          />

          {/* Quick Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>Tap for 1-Click Demo Login:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.demoBtn,
                  styles.demoSuperAdmin,
                  email === 'superadmin@paalnote.com' && styles.demoBtnSelected,
                ]}
                onPress={() => handleQuickDemo('superadmin@paalnote.com', 'admin123')}
              >
                <Text style={styles.demoBtnRole}>Super Admin</Text>
                <Text style={styles.demoBtnHint}>Full System</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.demoBtn,
                  styles.demoAdmin,
                  email === 'admin@paalnote.com' && styles.demoBtnSelected,
                ]}
                onPress={() => handleQuickDemo('admin@paalnote.com', 'admin123')}
              >
                <Text style={styles.demoBtnRole}>Admin</Text>
                <Text style={styles.demoBtnHint}>Operations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.demoBtn,
                  styles.demoEmployee,
                  email === 'employee@paalnote.com' && styles.demoBtnSelected,
                ]}
                onPress={() => handleQuickDemo('employee@paalnote.com', 'emp123')}
              >
                <Text style={styles.demoBtnRole}>Employee</Text>
                <Text style={styles.demoBtnHint}>Daily Entry</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Demo Data Link */}
          <TouchableOpacity
            style={styles.resetDataButton}
            onPress={handleResetData}
            disabled={resetting}
          >
            <Ionicons name="refresh-circle-outline" size={16} color={Colors.slate500} />
            <Text style={styles.resetDataText}>
              {resetting ? 'Resetting...' : 'Reset to Fresh Demo Dataset'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Paal-Note v1.0 • Professional JavaScript Dairy Management System
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: 36,
    paddingBottom: 36,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.primaryLight,
    marginTop: 4,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  featureBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  demoSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
  },
  demoBtnSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  demoSuperAdmin: {
    backgroundColor: '#F3E8FF',
    borderColor: '#D8B4FE',
  },
  demoAdmin: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  demoEmployee: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  demoBtnRole: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  demoBtnHint: {
    fontSize: 10,
    color: Colors.slate500,
    marginTop: 1,
  },
  resetDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: 6,
  },
  resetDataText: {
    fontSize: 12,
    color: Colors.slate500,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  footerText: {
    textAlign: 'center',
    color: Colors.primaryLight,
    fontSize: 12,
    marginTop: Spacing.lg,
  },
});
