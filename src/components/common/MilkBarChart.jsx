import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

export const MilkBarChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Find max value for scaling height
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.collection, d.distribution)),
    50
  );

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Collection (L)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>Distribution (L)</Text>
        </View>
      </View>

      {/* Bars container */}
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const collHeightPercent = Math.min(Math.round((item.collection / maxVal) * 100), 100);
          const distHeightPercent = Math.min(Math.round((item.distribution / maxVal) * 100), 100);

          return (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.barsContainer}>
                {/* Collection bar */}
                <View style={styles.singleBarWrapper}>
                  <Text style={styles.barValText}>{item.collection > 0 ? Math.round(item.collection) : ''}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(collHeightPercent, 4)}%`,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>

                {/* Distribution bar */}
                <View style={styles.singleBarWrapper}>
                  <Text style={styles.barValText}>{item.distribution > 0 ? Math.round(item.distribution) : ''}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(distHeightPercent, 4)}%`,
                        backgroundColor: Colors.secondary,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.dayLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.slate600,
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate200,
    paddingBottom: 4,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    justifyContent: 'center',
    width: '100%',
  },
  singleBarWrapper: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
    flex: 1,
    maxWidth: 16,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValText: {
    fontSize: 9,
    color: Colors.slate500,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: Colors.slate600,
    marginTop: 6,
    fontWeight: '600',
  },
});
