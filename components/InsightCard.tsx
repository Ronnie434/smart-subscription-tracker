import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface InsightCardProps {
  type: 'savings' | 'spending' | 'renewal' | 'count' | 'info';
  message: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function InsightCard({ type, message, priority = 'medium' }: InsightCardProps) {
  const getIconAndColor = () => {
    switch (type) {
      case 'savings':
        return { icon: '💰', color: theme.colors.success };
      case 'spending':
        return { icon: '📊', color: theme.colors.warning };
      case 'renewal':
        return { icon: '🔔', color: theme.colors.primary };
      case 'count':
        return { icon: '📱', color: theme.colors.secondary };
      default:
        return { icon: 'ℹ️', color: theme.colors.textSecondary };
    }
  };

  const { icon, color } = getIconAndColor();

  const getBorderColor = () => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.textSecondary;
      default:
        return theme.colors.border;
    }
  };

  return (
    <View
      style={[
        styles.container,
        theme.shadows.sm,
        { borderLeftColor: getBorderColor() },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});