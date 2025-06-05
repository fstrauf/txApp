/**
 * Bulletproof Subscription Service
 * 
 * Simple, centralized subscription management:
 * - One subscription record per user (latest wins)
 * - Clear status: ACTIVE, CANCELED, EXPIRED
 * - Clear plans: FREE, TRIAL, GOLD
 * - All subscription logic in one place
 */

import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export type SubscriptionPlan = 'FREE' | 'TRIAL' | 'SILVER' | 'GOLD';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface UserSubscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle?: BillingCycle;
  trialDays?: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export class SubscriptionService {
  
  /**
   * Get user's current active subscription
   * Returns null if user has no active subscriptions
   */
  static async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    console.log(`[SubscriptionService] Getting current subscription for user: ${userId}`);
    
    // First try to find an active subscription
    const activeSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'ACTIVE')
      ),
      orderBy: [desc(subscriptions.updatedAt)]
    });

    if (activeSubscription) {
      console.log(`[SubscriptionService] Found active subscription: ${activeSubscription.plan} ${activeSubscription.status}`);
      return activeSubscription as UserSubscription;
    }

    // If no active subscription, get the most recent one for reference (but caller should check status)
    const latestSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      orderBy: [desc(subscriptions.updatedAt)]
    });

    if (latestSubscription) {
      console.log(`[SubscriptionService] Found latest subscription: ${latestSubscription.plan} ${latestSubscription.status} (not active)`);
      return latestSubscription as UserSubscription;
    }

    console.log(`[SubscriptionService] No subscription found for user: ${userId}`);
    return null;
  }

  /**
   * Start a 14-day trial for a user
   * Cancels any existing subscriptions first
   */
  static async startTrial(userId: string): Promise<UserSubscription> {
    console.log(`[SubscriptionService] Starting trial for user: ${userId}`);
    
    // Cancel any existing subscriptions
    await this.cancelAllUserSubscriptions(userId);
    
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    
    const result = await db
      .insert(subscriptions)
      .values({
        userId,
        status: 'ACTIVE' as any,
        plan: 'FREE' as any, // Using FREE temporarily until TRIAL enum is available
        billingCycle: 'MONTHLY' as any,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialEndsAt: trialEnd,
        cancelAtPeriodEnd: false,
      })
      .returning();

    const newSubscription = result[0] as UserSubscription;
    console.log(`[SubscriptionService] Trial started successfully: ${newSubscription.id}`);
    
    return newSubscription;
  }

  /**
   * Subscribe user to a paid plan
   * Cancels any existing subscriptions first
   */
  static async createSubscription(input: CreateSubscriptionInput): Promise<UserSubscription> {
    console.log(`[SubscriptionService] Creating subscription for user: ${input.userId}, plan: ${input.plan}`);
    
    // Cancel any existing subscriptions
    await this.cancelAllUserSubscriptions(input.userId);
    
    const now = new Date();
    const billingCycle = input.billingCycle || 'MONTHLY';
    
    // Calculate period end based on billing cycle
    let periodEnd: Date;
    if (billingCycle === 'ANNUAL') {
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
    
    // Handle trial period if specified
    let trialEndsAt: Date | undefined;
    if (input.trialDays && input.trialDays > 0) {
      trialEndsAt = new Date(now.getTime() + input.trialDays * 24 * 60 * 60 * 1000);
    }
    
    const result = await db
      .insert(subscriptions)
      .values({
        userId: input.userId,
        status: 'ACTIVE' as any,
        plan: input.plan as any,
        billingCycle: billingCycle as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId,
      })
      .returning();

    const newSubscription = result[0] as UserSubscription;
    console.log(`[SubscriptionService] Subscription created successfully: ${newSubscription.id}`);
    
    return newSubscription;
  }

  /**
   * Cancel user's subscription
   * Sets status to CANCELED and cancelAtPeriodEnd to true
   */
  static async cancelSubscription(userId: string): Promise<UserSubscription | null> {
    console.log(`[SubscriptionService] Canceling subscription for user: ${userId}`);
    
    const currentSub = await this.getCurrentSubscription(userId);
    if (!currentSub) {
      console.log(`[SubscriptionService] No active subscription to cancel for user: ${userId}`);
      return null;
    }

    if (currentSub.status === 'CANCELED') {
      console.log(`[SubscriptionService] Subscription already canceled for user: ${userId}`);
      return currentSub;
    }

    const result = await db
      .update(subscriptions)
      .set({
        status: 'CANCELED' as any,
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, currentSub.id))
      .returning();

    const canceledSubscription = result[0] as UserSubscription;
    console.log(`[SubscriptionService] Subscription canceled successfully: ${canceledSubscription.id}`);
    
    return canceledSubscription;
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(userId: string): Promise<UserSubscription | null> {
    console.log(`[SubscriptionService] Reactivating subscription for user: ${userId}`);
    
    const currentSub = await this.getCurrentSubscription(userId);
    if (!currentSub) {
      console.log(`[SubscriptionService] No subscription to reactivate for user: ${userId}`);
      return null;
    }

    if (currentSub.status === 'ACTIVE') {
      console.log(`[SubscriptionService] Subscription already active for user: ${userId}`);
      return currentSub;
    }

    const result = await db
      .update(subscriptions)
      .set({
        status: 'ACTIVE' as any,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, currentSub.id))
      .returning();

    const reactivatedSubscription = result[0] as UserSubscription;
    console.log(`[SubscriptionService] Subscription reactivated successfully: ${reactivatedSubscription.id}`);
    
    return reactivatedSubscription;
  }

  /**
   * Update subscription from Stripe webhook
   * Used when Stripe sends us updates about subscription changes
   */
  static async updateFromStripe(stripeSubscriptionId: string, updates: {
    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }): Promise<UserSubscription | null> {
    console.log(`[SubscriptionService] Updating subscription from Stripe: ${stripeSubscriptionId}`);
    
    // Find subscription by Stripe ID
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)
    });

    if (!existingSub) {
      console.log(`[SubscriptionService] No subscription found with Stripe ID: ${stripeSubscriptionId}`);
      return null;
    }

    // Map Stripe status to our status
    let status: SubscriptionStatus = existingSub.status as SubscriptionStatus;
    if (updates.status) {
      switch (updates.status) {
        case 'active':
        case 'trialing':
          status = 'ACTIVE';
          break;
        case 'canceled':
        case 'past_due':
          status = 'CANCELED';
          break;
        default:
          status = 'ACTIVE';
      }
    }

    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (updates.currentPeriodStart) {
      updateData.currentPeriodStart = updates.currentPeriodStart;
    }
    if (updates.currentPeriodEnd) {
      updateData.currentPeriodEnd = updates.currentPeriodEnd;
    }
    if (updates.trialEnd) {
      updateData.trialEndsAt = updates.trialEnd;
    }
    if (updates.cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;
    }

    const result = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, existingSub.id))
      .returning();

    const updatedSubscription = result[0] as UserSubscription;
    console.log(`[SubscriptionService] Subscription updated from Stripe: ${updatedSubscription.id}`);
    
    return updatedSubscription;
  }

  /**
   * Check if user has access to premium features
   */
  static async hasAccess(userId: string): Promise<{ hasAccess: boolean; reason: string }> {
    const subscription = await this.getCurrentSubscription(userId);
    
    if (!subscription) {
      return { hasAccess: false, reason: 'No subscription found' };
    }

    if (subscription.status === 'CANCELED') {
      return { hasAccess: false, reason: 'Subscription canceled' };
    }

    if (subscription.status === 'EXPIRED') {
      return { hasAccess: false, reason: 'Subscription expired' };
    }

    // Check if trial has expired
    if (subscription.plan === 'TRIAL' && subscription.trialEndsAt) {
      const now = new Date();
      if (now > subscription.trialEndsAt) {
        // Mark as expired
        await db
          .update(subscriptions)
          .set({ status: 'EXPIRED' as any, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscription.id));
        
        return { hasAccess: false, reason: 'Trial expired' };
      }
    }

    // Check if subscription period has ended
    if (subscription.currentPeriodEnd) {
      const now = new Date();
      if (now > subscription.currentPeriodEnd && subscription.plan !== 'TRIAL') {
        // Mark as expired
        await db
          .update(subscriptions)
          .set({ status: 'EXPIRED' as any, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscription.id));
        
        return { hasAccess: false, reason: 'Subscription period ended' };
      }
    }

    return { hasAccess: true, reason: `Active ${subscription.plan} subscription` };
  }

  /**
   * Expire all subscriptions that have passed their end dates
   * This should be called by a cron job
   */
  static async expireOverdueSubscriptions(): Promise<number> {
    console.log('[SubscriptionService] Checking for overdue subscriptions...');
    
    const now = new Date();
    
    // Find active subscriptions that should be expired
    const overdueSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'ACTIVE' as any),
          // Either trial ended or current period ended
        )
      );

    let expiredCount = 0;

    for (const sub of overdueSubscriptions) {
      let shouldExpire = false;
      
      // Check if trial expired
      if (sub.plan === 'TRIAL' && sub.trialEndsAt && now > sub.trialEndsAt) {
        shouldExpire = true;
      }
      
      // Check if subscription period ended (for non-trial subscriptions)
      if (sub.plan !== 'TRIAL' && sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
        shouldExpire = true;
      }

      if (shouldExpire) {
        await db
          .update(subscriptions)
          .set({ status: 'EXPIRED' as any, updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        
        console.log(`[SubscriptionService] Expired subscription: ${sub.id} (${sub.plan})`);
        expiredCount++;
      }
    }

    console.log(`[SubscriptionService] Expired ${expiredCount} overdue subscriptions`);
    return expiredCount;
  }

  /**
   * Helper: Cancel all subscriptions for a user
   * Used internally before creating new subscriptions
   */
  private static async cancelAllUserSubscriptions(userId: string): Promise<void> {
    console.log(`[SubscriptionService] Canceling all subscriptions for user: ${userId}`);
    
    await db
      .update(subscriptions)
      .set({
        status: 'CANCELED' as any,
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'ACTIVE' as any)
        )
      );
  }

  /**
   * Get subscription analytics/summary
   */
  static async getSubscriptionSummary(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    const access = await this.hasAccess(userId);
    
    return {
      subscription,
      hasAccess: access.hasAccess,
      reason: access.reason,
      isOnTrial: subscription?.plan === 'TRIAL',
      isPaid: subscription?.plan === 'GOLD',
      daysRemaining: subscription?.trialEndsAt || subscription?.currentPeriodEnd 
        ? Math.ceil((new Date(subscription.trialEndsAt || subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0
    };
  }
}
