import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Button } from './Button';

export const ConfirmLogoutModal = ({
  visible,
  onCancel,
  onConfirm,
  userName,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Ionicons name="log-out" size={28} color={Colors.danger} />
          </View>

          <Text style={styles.title}>Confirm Sign Out</Text>
          <Text style={styles.message}>
            {userName ? `Are you sure you want to sign out, ${userName}?` : 'Are you sure you want to sign out?'}
          </Text>
          <Text style={styles.subtext}>
            You will need to enter your credentials or tap demo login to access your dairy account again.
          </Text>

          <View style={styles.buttonsRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              style={styles.cancelBtn}
              onPress={onCancel}
            />
            <Button
              title="Yes, Log Out"
              variant="danger"
              size="md"
              icon="log-out-outline"
              style={styles.logoutBtn}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate700,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 6,
  },
  logoutBtn: {
    flex: 1.2,
    marginLeft: 6,
  },
});
