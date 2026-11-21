import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { SessionType } from '../../types';

interface SessionToggleProps {
  selected: SessionType | 'all';
  onSelect: (session: SessionType | 'all') => void;
  showAllOption?: boolean;
}

export const SessionToggle: React.FC<SessionToggleProps> = ({
  selected,
  onSelect,
  showAllOption = false,
}) => {
  return (
    <View style={styles.container}>
      {showAllOption && (
        <TouchableOpacity
          style={[styles.pill, selected === 'all' && styles.pillActiveAll]}
          onPress={() => onSelect('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, selected === 'all' && styles.pillTextActive]}>
            All Day
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.pill, selected === 'morning' && styles.pillActiveMorning]}
        onPress={() => onSelect('morning')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="sunny"
          size={16}
          color={selected === 'morning' ? Colors.white : Colors.morning}
          style={styles.icon}
        />
        <Text
          style={[
            styles.pillText,
            selected === 'morning' ? styles.pillTextActive : { color: Colors.morning },
          ]}
        >
          Morning
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, selected === 'evening' && styles.pillActiveEvening]}
        onPress={() => onSelect('evening')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="moon"
          size={16}
          color={selected === 'evening' ? Colors.white : Colors.evening}
          style={styles.icon}
        />
        <Text
          style={[
            styles.pillText,
            selected === 'evening' ? styles.pillTextActive : { color: Colors.evening },
          ]}
        >
          Evening
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: BorderRadius.full,
    padding: 3,
    alignSelf: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  pillActiveAll: {
    backgroundColor: Colors.slate800,
  },
  pillActiveMorning: {
    backgroundColor: Colors.morning,
  },
  pillActiveEvening: {
    backgroundColor: Colors.evening,
  },
  icon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  pillTextActive: {
    color: Colors.white,
  },
});
