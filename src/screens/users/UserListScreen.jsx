import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { userApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export const UserListScreen = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('employee');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userApi.getAll();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', err.message || 'Could not fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Name, email, and password are required');
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role,
        permissions: {
          canEditActivities: true,
          canRecordPayments: role !== 'employee',
          canManageParties: role !== 'employee',
          canViewReports: role !== 'employee',
        },
      });

      if (res.success) {
        Alert.alert('Success', `User ${name} created successfully`);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const renderUserCard = ({ item }) => {
    const isSuperAdmin = item.role === 'super_admin';
    const isAdmin = item.role === 'admin';

    return (
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.name ? item.name.charAt(0) : 'U'}</Text>
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.phone ? <Text style={styles.userPhone}>{item.phone}</Text> : null}
          </View>
          <Badge
            label={item.role.replace('_', ' ')}
            variant={isSuperAdmin ? 'primary' : isAdmin ? 'info' : 'morning'}
          />
        </View>

        <View style={styles.permissionsRow}>
          <View style={styles.permTag}>
            <Ionicons
              name={item.permissions?.canEditActivities ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.permissions?.canEditActivities ? Colors.success : Colors.slate300}
            />
            <Text style={styles.permText}>Edit Milk Entries</Text>
          </View>

          <View style={styles.permTag}>
            <Ionicons
              name={item.permissions?.canRecordPayments ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.permissions?.canRecordPayments ? Colors.success : Colors.slate300}
            />
            <Text style={styles.permText}>Record Payments</Text>
          </View>

          <View style={styles.permTag}>
            <Ionicons
              name={item.permissions?.canViewReports ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.permissions?.canViewReports ? Colors.success : Colors.slate300}
            />
            <Text style={styles.permText}>Reports Access</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="User & Role Management"
        subtitle="Access Controls & Permissions"
        showBack
        rightAction={
          hasRole('super_admin', 'admin')
            ? {
                icon: 'person-add-outline',
                onPress: () => setShowAddModal(true),
              }
            : undefined
        }
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id || item._id || item.email}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          showAddModal ? (
            <Card style={styles.addCard}>
              <Text style={styles.addCardTitle}>Create New Account</Text>

              <Input
                label="Full Name"
                placeholder="e.g. Anandha Kumar"
                value={name}
                onChangeText={setName}
                required
              />

              <Input
                label="Email Address"
                placeholder="e.g. anand@paalnote.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                isPassword
                required
              />

              <Input
                label="Phone Number"
                placeholder="e.g. 98401 99999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.roleLabel}>Role Assignment</Text>
              <View style={styles.roleButtonsRow}>
                {currentUser?.role === 'super_admin' && (
                  <TouchableOpacity
                    style={[styles.roleBtn, role === 'admin' && styles.roleBtnActiveAdmin]}
                    onPress={() => setRole('admin')}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        role === 'admin' && styles.roleBtnTextActive,
                      ]}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.roleBtn, role === 'employee' && styles.roleBtnActiveEmp]}
                  onPress={() => setRole('employee')}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === 'employee' && styles.roleBtnTextActive,
                    ]}
                  >
                    Employee
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', marginTop: Spacing.md }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1, marginRight: 6 }}
                  onPress={() => setShowAddModal(false)}
                />
                <Button
                  title="Create User"
                  variant="primary"
                  size="sm"
                  style={{ flex: 1, marginLeft: 6 }}
                  loading={saving}
                  onPress={handleCreateUser}
                />
              </View>
            </Card>
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  addCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    borderColor: Colors.primary,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: Spacing.md,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
    marginBottom: 6,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    marginRight: 6,
  },
  roleBtnActiveAdmin: {
    backgroundColor: Colors.secondary,
  },
  roleBtnActiveEmp: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  roleBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 1,
  },
  userPhone: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 1,
  },
  permissionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  permTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  permText: {
    fontSize: 11,
    color: Colors.slate600,
    marginLeft: 4,
  },
});
