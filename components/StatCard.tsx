import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  size?: 'small' | 'large';
  variant?: 'default' | 'accent';
}

export default function StatCard({
  label,
  value,
  subtitle,
  size = 'small',
  variant = 'default',
}: StatCardProps) {
  const { theme } = useTheme();
  const isLarge = size === 'large';
  const isAccent = variant === 'accent';

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      flex: 1,
    },
    cardLarge: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    cardAccent: {
      backgroundColor: theme.colors.primary,
    },
    label: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    labelLarge: {
      ...theme.typography.body,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    value: {
      ...theme.typography.h3,
      color: theme.colors.text,
      fontWeight: '700',
    },
    valueLarge: {
      ...theme.typography.h1,
      color: '#FFFFFF',
      fontWeight: '700',
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    subtitleAccent: {
      color: '#FFFFFF',
      opacity: 0.85,
    },
  });

  return (
    <View
      style={[
        styles.card,
        isLarge && styles.cardLarge,
        isAccent && styles.cardAccent,
        theme.shadows.md,
      ]}
    >
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        {label}
      </Text>
      <Text style={[styles.value, isLarge && styles.valueLarge]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, isAccent && styles.subtitleAccent]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}