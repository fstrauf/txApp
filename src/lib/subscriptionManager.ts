import { db } from '@/db';
import { subscriptions, users, accounts } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export interface SubscriptionData {
  userId: string;
  plan: 'SILVER' | 'GOLD';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}

/**
 * Subscription Manager - Ensures one subscription record per user
 * Handles all subscription state changes cleanly
 */
export class SubscriptionManager {
  
  /**
   * Get the current active subscription for a user
   * Priority: ACTIVE > TRIALING > Most recent
   */
  static async getCurrentSubscription(userId: string) {
    const allSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
      orderBy: [desc(subscriptions.updatedAt)],
    });

    if (allSubs.length === 0) return null;

    // Priority 1: Active paid subscriptions
    const active = allSubs.find(sub => 
      sub.status === 'ACTIVE' && 
      sub.currentPeriodEnd && 
      new Date(sub.currentPeriodEnd) > new Date()
    );
    if (active) return active;

    // Priority 2: Active trials
    const trialing = allSubs.find(sub => 
      sub.status === 'TRIALING' && 
      sub.trialEndsAt && 
      new Date(sub.trialEndsAt) > new Date()
    );
    if (trialing) return trialing;

    // Priority 3: Most recent
    return allSubs[0];
  }

  /**
   * Create or update subscription - ensures only one subscription per user
   */
  static async upsertSubscription(data: SubscriptionData) {
    console.log(`[SubscriptionManager] Upserting subscription for user ${data.userId}: ${data.plan} ${data.status}`);
    
    // Get user's account (optional for credentials users)
    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, data.userId)
    });

    // Log whether user has account record or not
    if (!userAccount) {
      console.log(`[SubscriptionManager] User ${data.userId} has no account record (likely credentials user)`);
    } else {
      console.log(`[SubscriptionManager] User ${data.userId} has account record: ${userAccount.provider}`);
    }

    // Check if subscription already exists by Stripe ID (most reliable)
    let existingSubscription = null;
    if (data.stripeSubscriptionId) {
      existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, data.stripeSubscriptionId)
      });
    }

    // If no Stripe-based match, check for user's current subscription
    if (!existingSubscription) {
      existingSubscription = await this.getCurrentSubscription(data.userId);
    }

    const subscriptionData = {
      userId: data.userId,
      accountId: userAccount?.id || null, // Use null if no account exists
      status: data.status as any,
      plan: data.plan as any,
      billingCycle: data.billingCycle as any,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      updatedAt: new Date(),
    };

    if (existingSubscription) {
      // Update existing subscription
      console.log(`[SubscriptionManager] Updating existing subscription ${existingSubscription.id}`);
      
      const result = await db
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.id, existingSubscription.id))
        .returning();

      // Cancel any other active subscriptions for this user
      await this.cancelOtherSubscriptions(data.userId, existingSubscription.id);
      
      return result[0];
    } else {
      // Create new subscription
      console.log(`[SubscriptionManager] Creating new subscription for user ${data.userId}`);
      
      // First, cancel any existing subscriptions for this user
      await this.cancelAllUserSubscriptions(data.userId);
      
      const result = await db
        .insert(subscriptions)
        .values({
          ...subscriptionData,
          createdAt: new Date(),
        })
        .returning();
      
      return result[0];
    }
  }

  /**
   * Start a trial for a user (cancels any existing subscriptions)
   */
  static async startTrial(userId: string, plan: 'SILVER' | 'GOLD' = 'SILVER', durationDays: number = 14) {
    console.log(`[SubscriptionManager] Starting ${durationDays}-day trial for user ${userId}`);
    
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + durationDays);
    
    return await this.upsertSubscription({
      userId,
      plan,
      billingCycle: 'MONTHLY',
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
      cancelAtPeriodEnd: false,
    });
  }

  /**
   * Upgrade from trial to paid subscription
   */
  static async upgradeFromTrial(
    userId: string, 
    plan: 'SILVER' | 'GOLD', 
    billingCycle: 'MONTHLY' | 'ANNUAL',
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  ) {
    console.log(`[SubscriptionManager] Upgrading user ${userId} from trial to ${plan} ${billingCycle}`);
    
    return await this.upsertSubscription({
      userId,
      plan,
      billingCycle,
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: null, // Clear trial
      cancelAtPeriodEnd: false,
      stripeSubscriptionId,
      stripeCustomerId,
    });
  }

  /**
   * Change subscription plan (Silver to Gold, Monthly to Annual, etc.)
   */
  static async changePlan(
    userId: string,
    newPlan: 'SILVER' | 'GOLD',
    newBillingCycle: 'MONTHLY' | 'ANNUAL',
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  ) {
    console.log(`[SubscriptionManager] Changing plan for user ${userId} to ${newPlan} ${newBillingCycle}`);
    
    return await this.upsertSubscription({
      userId,
      plan: newPlan,
      billingCycle: newBillingCycle,
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId,
      stripeCustomerId,
    });
  }

  /**
   * Cancel subscription (mark for cancellation at period end)
   */
  static async cancelSubscription(userId: string, immediately: boolean = false) {
    console.log(`[SubscriptionManager] Canceling subscription for user ${userId}, immediately: ${immediately}`);
    
    const currentSub = await this.getCurrentSubscription(userId);
    if (!currentSub) {
      throw new Error('No active subscription found to cancel');
    }

    if (immediately) {
      // Cancel immediately
      return await db
        .update(subscriptions)
        .set({
          status: 'CANCELED' as any,
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSub.id))
        .returning();
    } else {
      // Cancel at period end
      return await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSub.id))
        .returning();
    }
  }

  /**
   * Handle subscription status changes from webhooks
   */
  static async handleStatusChange(
    stripeSubscriptionId: string, 
    newStatus: 'active' | 'canceled' | 'past_due' | 'trialing'
  ) {
    console.log(`[SubscriptionManager] Handling status change for ${stripeSubscriptionId}: ${newStatus}`);
    
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)
    });

    if (!subscription) {
      console.error(`No subscription found with Stripe ID: ${stripeSubscriptionId}`);
      return null;
    }

    let dbStatus: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
    switch (newStatus) {
      case 'active':
        dbStatus = 'ACTIVE';
        break;
      case 'canceled':
        dbStatus = 'CANCELED';
        break;
      case 'past_due':
        dbStatus = 'PAST_DUE';
        break;
      case 'trialing':
        dbStatus = 'TRIALING';
        break;
      default:
        dbStatus = 'ACTIVE';
    }

    return await db
      .update(subscriptions)
      .set({
        status: dbStatus as any,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();
  }

  /**
   * Cancel all other subscriptions for a user except the specified one
   */
  private static async cancelOtherSubscriptions(userId: string, keepSubscriptionId: string) {
    console.log(`[SubscriptionManager] Canceling other subscriptions for user ${userId}, keeping ${keepSubscriptionId}`);
    
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
          eq(subscriptions.id, keepSubscriptionId) // NOT equal to the one we want to keep
        )
      );
  }

  /**
   * Cancel all subscriptions for a user
   */
  private static async cancelAllUserSubscriptions(userId: string) {
    console.log(`[SubscriptionManager] Canceling all subscriptions for user ${userId}`);
    
    await db
      .update(subscriptions)
      .set({
        status: 'CANCELED' as any,
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  }

  /**
   * Clean up data integrity issues - call this for maintenance
   */
  static async cleanupDuplicateSubscriptions() {
    console.log('[SubscriptionManager] Starting cleanup of duplicate subscriptions');
    
    // Get all users with multiple subscriptions
    const duplicateUsers = await db
      .select({
        userId: subscriptions.userId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(subscriptions)
      .groupBy(subscriptions.userId)
      .having(sql`count(*) > 1`);

    for (const user of duplicateUsers) {
      console.log(`[SubscriptionManager] Cleaning up ${user.count} subscriptions for user ${user.userId}`);
      
      const userSubs = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, user.userId),
        orderBy: [desc(subscriptions.updatedAt)]
      });

      // Keep the best subscription (first in our priority order)
      const keeper = await this.getCurrentSubscription(user.userId);
      if (keeper) {
        // Cancel all others
        for (const sub of userSubs) {
          if (sub.id !== keeper.id) {
            await db
              .update(subscriptions)
              .set({
                status: 'CANCELED' as any,
                cancelAtPeriodEnd: true,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, sub.id));
          }
        }
      }
    }
    
    console.log('[SubscriptionManager] Cleanup completed');
  }
}
