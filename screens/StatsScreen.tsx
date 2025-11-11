import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription } from '../types';
import { storage } from '../utils/storage';
import { calculations } from '../utils/calculations';
import { parseLocalDate } from '../utils/dateHelpers';
import StatCard from '../components/StatCard';
import CategoryBar from '../components/CategoryBar';
import InsightCard from '../components/InsightCard';
import RenewalItem from '../components/RenewalItem';
import LoadingIndicator from '../components/LoadingIndicator';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscriptions } from '../hooks/useRealtimeSubscriptions';

type SubscriptionsStackParamList = {
  Home: undefined;
  AddSubscription: { subscription?: Subscription };
  EditSubscription: { subscription: Subscription };
  Stats: undefined;
};

type StatsScreenNavigationProp = StackNavigationProp<SubscriptionsStackParamList, 'Stats'>;

export default function StatsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<StatsScreenNavigationProp>();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set up real-time subscriptions for live updates
  useRealtimeSubscriptions(user?.id, {
    onInsert: (newSubscription) => {
      setSubscriptions((prev) => {
        const exists = prev.some((sub) => sub.id === newSubscription.id);
        if (exists) return prev;
        return [newSubscription, ...prev];
      });
    },
    onUpdate: (updatedSubscription) => {
      setSubscriptions((prev) => {
        const index = prev.findIndex((sub) => sub.id === updatedSubscription.id);
        if (index === -1) return [updatedSubscription, ...prev];
        const updated = [...prev];
        updated[index] = updatedSubscription;
        return updated;
      });
    },
    onDelete: (deletedId) => {
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== deletedId));
    },
  });

  const loadSubscriptions = async (forceRefresh = false) => {
    try {
      const data = forceRefresh ? await storage.refresh() : await storage.getAll();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load subscriptions';
      Alert.alert(
        'Error Loading Data',
        errorMessage.includes('network') || errorMessage.includes('Network')
          ? 'Please check your internet connection and try again.'
          : errorMessage
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSubscriptions(true);
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await storage.refresh();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      await loadSubscriptions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRenewalPress = (subscription: Subscription) => {
    navigation.navigate('EditSubscription', { subscription });
  };

  // Calculate statistics
  const totalMonthly = calculations.getTotalMonthlyCost(subscriptions);
  const totalYearly = calculations.getTotalYearlyCost(subscriptions);
  const averageCost = calculations.getAverageMonthlyCost(subscriptions);
  const billingDistribution = calculations.getBillingCycleDistribution(subscriptions);
  const nextRenewal = calculations.getNextRenewalDate(subscriptions);
  const categoryBreakdown = calculations.getCategorySorted(subscriptions);
  const renewalTimeline = calculations.getRenewalTimeline(subscriptions, 30);
  const insights = calculations.generateInsights(subscriptions);

  // Format next renewal date
  const formatNextRenewal = () => {
    if (!nextRenewal) return 'None';
    const daysUntil = calculations.getDaysUntilRenewal(nextRenewal);
    
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days`;
    
    // Use parseLocalDate to prevent timezone conversion issues
    // "2025-12-13" should display as "Dec 13", not "Dec 12"
    const date = parseLocalDate(nextRenewal);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    heroSection: {
      marginBottom: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.shadows.md,
    },
    billingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    billingItem: {
      flex: 1,
      alignItems: 'center',
    },
    billingValue: {
      ...theme.typography.h2,
      color: theme.colors.text,
      fontWeight: '700',
      marginBottom: theme.spacing.xs,
    },
    billingLabel: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    billingDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
    },
    renewalGroup: {
      marginBottom: theme.spacing.lg,
    },
    renewalGroupTitle: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return <LoadingIndicator />;
  }

  if (subscriptions.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <EmptyState
            title="No Statistics Yet"
            message="Add subscriptions to see your spending insights"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Monthly Total */}
        <View style={styles.heroSection}>
          <StatCard
            label="Monthly Spending"
            value={`$${totalMonthly.toFixed(2)}`}
            subtitle={`$${totalYearly.toFixed(2)} per year`}
            size="large"
            variant="accent"
          />
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Yearly Total"
              value={`$${totalYearly.toFixed(2)}`}
            />
            <StatCard
              label="Subscriptions"
              value={subscriptions.length.toString()}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Average Cost"
              value={`$${averageCost.toFixed(2)}`}
              subtitle="per month"
            />
            <StatCard
              label="Next Renewal"
              value={formatNextRenewal()}
            />
          </View>
        </View>

        {/* Billing Cycle Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Cycles</Text>
          <View style={styles.card}>
            <View style={styles.billingRow}>
              <View style={styles.billingItem}>
                <Text style={styles.billingValue}>{billingDistribution.monthly}</Text>
                <Text style={styles.billingLabel}>Monthly</Text>
              </View>
              <View style={styles.billingDivider} />
              <View style={styles.billingItem}>
                <Text style={styles.billingValue}>{billingDistribution.yearly}</Text>
                <Text style={styles.billingLabel}>Yearly</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Category Spending Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.card}>
              {categoryBreakdown.map((item, index) => (
                <CategoryBar
                  key={item.category}
                  category={item.category}
                  amount={item.total}
                  percentage={item.percentage}
                  maxPercentage={categoryBreakdown[0].percentage}
                />
              ))}
            </View>
          </View>
        )}

        {/* Actionable Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type as any}
                message={insight.message}
                priority={insight.priority}
              />
            ))}
          </View>
        )}

        {/* Upcoming Renewals Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Renewals (30 days)</Text>
          
          {renewalTimeline.thisWeek.length > 0 && (
            <View style={styles.renewalGroup}>
              <Text style={styles.renewalGroupTitle}>This Week</Text>
              {renewalTimeline.thisWeek.map((subscription) => (
                <RenewalItem
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() => handleRenewalPress(subscription)}
                />
              ))}
            </View>
          )}

          {renewalTimeline.nextWeek.length > 0 && (
            <View style={styles.renewalGroup}>
              <Text style={styles.renewalGroupTitle}>Next Week</Text>
              {renewalTimeline.nextWeek.map((subscription) => (
                <RenewalItem
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() => handleRenewalPress(subscription)}
                />
              ))}
            </View>
          )}

          {renewalTimeline.thisMonth.length > 0 && (
            <View style={styles.renewalGroup}>
              <Text style={styles.renewalGroupTitle}>This Month</Text>
              {renewalTimeline.thisMonth.map((subscription) => (
                <RenewalItem
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() => handleRenewalPress(subscription)}
                />
              ))}
            </View>
          )}

          {renewalTimeline.thisWeek.length === 0 &&
            renewalTimeline.nextWeek.length === 0 &&
            renewalTimeline.thisMonth.length === 0 && (
              <View style={styles.card}>
                <Text style={styles.emptyText}>No renewals in the next 30 days</Text>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}