import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { categoryColors } from '../constants/colors';

interface CategoryBarProps {
  category: string;
  amount: number;
  percentage: number;
  maxPercentage?: number;
}

export default function CategoryBar({
  category,
  amount,
  percentage,
  maxPercentage = 100,
}: CategoryBarProps) {
  const { theme } = useTheme();
  
  // Normalize percentage to the max for visual representation
  const displayPercentage = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
  
  // Get color for category, default to primary if not found
  const barColor = categoryColors[category as keyof typeof categoryColors] || theme.colors.primary;

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    category: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
    },
    amount: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    barContainer: {
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
      marginBottom: theme.spacing.xs,
    },
    bar: {
      height: '100%',
      borderRadius: theme.borderRadius.sm,
    },
    percentage: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.amount}>${amount.toFixed(2)}/mo</Text>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { width: `${Math.min(displayPercentage, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}