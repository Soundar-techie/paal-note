import React, { useState, useEffect, useCallback } from 'react';
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
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { masterApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const MastersScreen = () => {
  const { hasRole } = useAuth();
  const [selectedType, setSelectedType] = useState('location');
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Item Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMasters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterApi.getAll(selectedType);
      if (res.success) {
        setMasters(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching masters:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const handleCreate = async () => {
    if (!newLabel.trim()) {
      Alert.alert('Required', 'Item label cannot be empty');
      return;
    }

    const key = newKey.trim() || newLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');

    setSaving(true);
    try {
      const res = await masterApi.create({
        type: selectedType,
        key,
        label: newLabel.trim(),
        value: newLabel.trim(),
      });

      if (res.success) {
        setNewLabel('');
        setNewKey('');
        setShowAddForm(false);
        fetchMasters();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, isSystem) => {
    if (isSystem) {
      Alert.alert('Protected', 'System default master records cannot be deleted');
      return;
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this master item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await masterApi.delete(id);
            if (res.success) {
              fetchMasters();
            }
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Master Settings"
        subtitle="Shared App Configuration"
        showBack
        rightAction={
          hasRole('super_admin', 'admin')
            ? {
                icon: 'add-circle-outline',
                onPress: () => setShowAddForm(true),
              }
            : undefined
        }
      />

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { type: 'location', label: 'Locations & Routes', icon: 'location' },
          { type: 'milk_type', label: 'Milk Types', icon: 'water' },
          { type: 'payment_method', label: 'Payment Methods', icon: 'cash' },
          { type: 'unit', label: 'Measurement Units', icon: 'scale' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.type}
            style={[
              styles.tabPill,
              selectedType === tab.type && styles.tabPillActive,
            ]}
            onPress={() => setSelectedType(tab.type)}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={selectedType === tab.type ? Colors.white : Colors.primary}
            />
            <Text
              style={[
                styles.tabText,
                selectedType === tab.type && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Add Item Box */}
        {showAddForm && (
          <Card style={styles.addCard}>
            <Text style={styles.addCardTitle}>
              Add New {selectedType.replace('_', ' ').toUpperCase()}
            </Text>
            <Input
              label="Item Display Label"
              placeholder="e.g. Hill Station Route"
              value={newLabel}
              onChangeText={setNewLabel}
              required
            />
            <Input
              label="Internal Key (Optional)"
              placeholder="e.g. hill_station_route"
              value={newKey}
              onChangeText={setNewKey}
            />
            <View style={{ flexDirection: 'row' }}>
              <Button
                title="Cancel"
                variant="secondary"
                size="sm"
                style={{ flex: 1, marginRight: 6 }}
                onPress={() => setShowAddForm(false)}
              />
              <Button
                title="Save Item"
                variant="primary"
                size="sm"
                style={{ flex: 1, marginLeft: 6 }}
                loading={saving}
                onPress={handleCreate}
              />
            </View>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View>
            {masters.length === 0 ? (
              <Card>
                <Text style={styles.emptyNote}>No master items configured for this category.</Text>
              </Card>
            ) : (
              masters.map((item) => (
                <View key={item._id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemKey}>Key: {item.key}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {item.isSystem ? (
                      <View style={styles.systemBadge}>
                        <Text style={styles.systemText}>SYSTEM</Text>
                      </View>
                    ) : hasRole('super_admin', 'admin') ? (
                      <TouchableOpacity
                        onPress={() => handleDelete(item._id, item.isSystem)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabScroll: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.slate100,
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
    marginLeft: 5,
  },
  tabTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    borderColor: Colors.primary,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
  },
  itemKey: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 2,
  },
  itemRight: {
    marginLeft: 8,
  },
  systemBadge: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  systemText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyNote: {
    textAlign: 'center',
    color: Colors.slate500,
    fontSize: 13,
    paddingVertical: 12,
  },
});
