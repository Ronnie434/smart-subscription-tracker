import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription } from '../types';
import { calculations } from '../utils/calculations';
import { parseLocalDate } from '../utils/dateHelpers';
import AnimatedPressable from './AnimatedPressable';

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
    return theme.colors.primary;
  };

  const renewalDate = parseLocalDate(subscription.renewalDate);
  const dateString = renewalDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#00000010',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    name: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      letterSpacing: -0.2,
      lineHeight: 22,
    },
    cost: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.primary,
      marginLeft: 12,
      lineHeight: 22,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    daysUntil: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
    },
  });

  return (
    <AnimatedPressable
      style={styles.container}
      onPress={onPress}
      scaleOnPress={0.98}
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
    </AnimatedPressable>
  );
}