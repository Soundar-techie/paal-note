import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { activityApi } from '../../api/client';
import { DailyActivity } from '../../types';
import { formatCurrency, formatLitres, formatDate } from '../../utils/formatters';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export const ActivityDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { hasRole, can } = useAuth();
  const { id } = route.params;

  const [activity, setActivity] = useState<DailyActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await activityApi.getAll();
        if (res.success && res.data) {
          const match = res.data.find((a: DailyActivity) => a._id === id);
          if (match) setActivity(match);
        }
      } catch (err) {
        console.error('Error fetching activity details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  const handleReverseActivity = async () => {
    if (!reversalReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a transparent reason for reversing this record');
      return;
    }

    setProcessing(true);
    try {
      const res = await activityApi.reverse(id, reversalReason.trim());
      if (res.success) {
        setActivity(res.data);
        setShowReverseModal(false);
        Alert.alert('Reversed', 'Activity has been reversed and party balance updated.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reverse activity');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <Header title="Activity Record" showBack />
        <View style={styles.centerContainer}>
          <Text>Activity entry not found</Text>
        </View>
      </View>
    );
  }

  const isCollection = activity.type === 'collection';

  return (
    <View style={styles.container}>
      <Header
        title={`${activity.session.toUpperCase()} ${activity.type.toUpperCase()}`}
        subtitle={formatDate(activity.date)}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Badge label={activity.session} variant={activity.session} size="md" />
            <Badge
              label={activity.status}
              variant={
                activity.status === 'active'
                  ? 'success'
                  : activity.status === 'corrected'
                  ? 'warning'
                  : 'danger'
              }
              size="md"
            />
          </View>

          {/* Quantity & Amount Header */}
          <View style={styles.heroBox}>
            <Text style={styles.heroQty}>{formatLitres(activity.quantityLitres)}</Text>
            <Text style={styles.heroAmount}>{formatCurrency(activity.totalAmount)}</Text>
            <Text style={styles.heroFormula}>
              {activity.quantityLitres} L × ₹{activity.ratePerLitre} / Litre
            </Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Party / Stakeholder</Text>
              <Text style={styles.detailVal}>{activity.partyName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Code & Location</Text>
              <Text style={styles.detailVal}>
                {activity.partyCode} • {activity.partyLocation}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Milk Variety</Text>
              <Text style={styles.detailVal}>{activity.milkType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operation</Text>
              <Text style={[styles.detailVal, { textTransform: 'capitalize' }]}>
                {activity.type.replace('_', ' ')} ({activity.partyType})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recorded By</Text>
              <Text style={styles.detailVal}>{activity.createdByName}</Text>
            </View>

            {activity.notes ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailVal}>{activity.notes}</Text>
              </View>
            ) : null}

            {activity.correctionReason ? (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.detailLabel, { color: Colors.danger }]}>Reversal / Correction Note</Text>
                <Text style={[styles.detailVal, { color: Colors.danger }]}>{activity.correctionReason}</Text>
              </View>
            ) : null}
          </View>

          {/* Admin Reversal Action */}
          {activity.status !== 'reversed' && hasRole('super_admin', 'admin') && (
            <View style={styles.reversalSection}>
              {!showReverseModal ? (
                <Button
                  title="Reverse Entry (Cancel & Adjust Balances)"
                  variant="outline"
                  size="sm"
                  onPress={() => setShowReverseModal(true)}
                  style={{ borderColor: Colors.danger }}
                  textStyle={{ color: Colors.danger }}
                />
              ) : (
                <View style={styles.reverseForm}>
                  <Text style={styles.reverseWarning}>
                    ⚠️ Reversing will cancel this milk entry and deduct ₹{activity.totalAmount} from the party's ledger.
                  </Text>
                  <Input
                    label="Reason for Reversal / Correction"
                    placeholder="e.g. Duplicate entry by mistake"
                    value={reversalReason}
                    onChangeText={setReversalReason}
                    required
                  />
                  <View style={{ flexDirection: 'row' }}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1, marginRight: 6 }}
                      onPress={() => setShowReverseModal(false)}
                    />
                    <Button
                      title="Confirm Reversal"
                      variant="danger"
                      size="sm"
                      style={{ flex: 1, marginLeft: 6 }}
                      loading={processing}
                      onPress={handleReverseActivity}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroBox: {
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroQty: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.slate900,
  },
  heroAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  heroFormula: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 4,
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.slate500,
    flex: 1,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate800,
    flex: 1,
    textAlign: 'right',
  },
  reversalSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  reverseForm: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  reverseWarning: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
    marginBottom: 8,
  },
});
