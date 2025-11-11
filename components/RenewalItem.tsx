import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription } from '../types';
import { calculations } from '../utils/calculations';
import { parseLocalDate } from '../utils/dateHelpers';

interface RenewalItemProps {
  subscription: Subscription;
  onPress?: () => void;
}

export default function RenewalItem({ subscription, onPress }: RenewalItemProps) {
  const { theme } = useTheme();
  const daysUntil = calculations.getDaysUntilRenewal(subscription.renewalDate);
  
  const getDaysText = () => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `${daysUntil} days`;
  };

  const getUrgencyColor = () => {
    if (daysUntil === 0) return theme.colors.error;
    if (daysUntil <= 3) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  const renewalDate = parseLocalDate(subscription.renewalDate);
  const dateString = renewalDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    name: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
      flex: 1,
    },
    cost: {
      ...theme.typography.bodyBold,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    daysUntil: {
      ...theme.typography.captionBold,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, theme.shadows.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{subscription.name}</Text>
          <Text style={styles.cost}>${subscription.cost.toFixed(2)}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.date}>{dateString}</Text>
          <Text style={[styles.daysUntil, { color: getUrgencyColor() }]}>
            {getDaysText()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}