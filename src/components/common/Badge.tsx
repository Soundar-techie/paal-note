import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'morning'
    | 'evening'
    | 'primary'
    | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'sm' }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors.successLight, text: Colors.success };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warning };
      case 'danger':
        return { bg: Colors.dangerLight, text: Colors.danger };
      case 'info':
        return { bg: Colors.infoLight, text: Colors.info };
      case 'morning':
        return { bg: Colors.morningLight, text: Colors.morning };
      case 'evening':
        return { bg: Colors.eveningLight, text: Colors.evening };
      case 'primary':
        return { bg: Colors.primaryLight, text: Colors.primaryDark };
      default:
        return { bg: Colors.slate100, text: Colors.slate600 };
    }
  };

  const { bg, text } = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'md' ? styles.sizeMd : styles.sizeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'md' ? styles.textMd : styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sizeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
