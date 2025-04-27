import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  json,
  uuid,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

// App beta opt in status enum
export const appBetaOptInStatusEnum = pgEnum('appBetaOptInStatus', ['OPTED_IN', 'DISMISSED']);

// Subscription plan enum
export const subscriptionPlanEnum = pgEnum('subscriptionPlan', ['FREE', 'SILVER', 'GOLD']);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscriptionStatus', ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING']);

// Billing cycle enum
export const billingCycleEnum = pgEnum('billingCycle', ['MONTHLY', 'ANNUAL']);

// Subscribers source enum
export const subscriberSourceEnum = pgEnum('subscriberSource', ['SPREADSHEET', 'BETA_ACCESS', 'OTHER']);

// Auth-related tables
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  password: text('password'),
  lunchMoneyApiKey: text('lunchMoneyApiKey'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }),
  resetToken: text('resetToken'),
  resetTokenExpiry: timestamp('resetTokenExpiry', { mode: 'date', withTimezone: true }),
  // Subscription fields
  api_key: text('api_key').unique(),
  subscriptionPlan: subscriptionPlanEnum('subscriptionPlan').default('FREE'),
  subscriptionStatus: subscriptionStatusEnum('subscriptionStatus'),
  billingCycle: billingCycleEnum('billingCycle'),
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  trialEndsAt: timestamp('trialEndsAt', { mode: 'date', withTimezone: true }),
  currentPeriodEndsAt: timestamp('currentPeriodEndsAt', { mode: 'date', withTimezone: true }),
  monthlyCategorizations: integer('monthlyCategorizations').default(0),
  categoriesResetDate: timestamp('categoriesResetDate', { mode: 'date', withTimezone: true }),
  // Add beta opt-in status directly to users table
  appBetaOptIn: appBetaOptInStatusEnum('appBetaOptIn'),
});

// Email subscribers table
export const subscribers = pgTable(
  'subscribers',
  {
    id: text('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
    email: text('email').notNull().unique(),
    source: subscriberSourceEnum('source').default('OTHER'),
    tags: json('tags').$type<string[]>(),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
  }
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    categorisationRange: text('categorisationRange'),
    categorisationTab: text('categorisationTab'),
    columnOrderCategorisation: json('columnOrderCategorisation'),
    created_at: timestamp('created_at', { mode: 'date', withTimezone: true }),
    lastUsed: timestamp('lastUsed', { mode: 'date', withTimezone: true }),
    requestsCount: integer('requestsCount').default(0),
    // Note: Subscription fields moved to users table
  },
  (account) => ({
    providerProviderAccountIdIndex: uniqueIndex('provider_provider_account_id_idx').on(
      account.provider,
      account.providerAccountId
    ),
  })
);

// Add subscriptions table to track history of subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('accountId')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  status: subscriptionStatusEnum('status').notNull(),
  plan: subscriptionPlanEnum('plan').notNull(),
  billingCycle: billingCycleEnum('billingCycle').notNull(),
  currentPeriodStart: timestamp('currentPeriodStart', { mode: 'date', withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd', { mode: 'date', withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').default(false),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  stripeCustomerId: text('stripeCustomerId'),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').notNull(), // Keep the id field, but it's NOT the primary key
  sessionToken: text('sessionToken').primaryKey().notNull(), // Make sessionToken the PK
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

// Application-specific tables
export const bankAccounts = pgTable('bankAccounts', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plaidItemId: text('plaidItemId'),
  plaidAccessToken: text('plaidAccessToken'),
  lastSync: timestamp('lastSync', { mode: 'date', withTimezone: true }),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
});

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isDefault: boolean('isDefault').default(false).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
  },
  (category) => ({
    nameUserIdIndex: uniqueIndex('name_userId_idx').on(category.name, category.userId),
  })
);

export const trainingJobs = pgTable('trainingJobs', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  predictionId: text('predictionId'),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completedAt', { mode: 'date', withTimezone: true }),
  error: text('error'),
});

export const classificationJobs = pgTable('classificationJobs', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  predictionId: text('predictionId'),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completedAt', { mode: 'date', withTimezone: true }),
  error: text('error'),
});

export const monthlyAggregates = pgTable(
  'monthlyAggregates',
  {
    id: text('id').primaryKey().notNull(),
    month: timestamp('month', { mode: 'date', withTimezone: true }).notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    income: decimal('income', { precision: 12, scale: 2 }).default('0').notNull(),
    tax: decimal('tax', { precision: 12, scale: 2 }).default('0').notNull(),
    credit: decimal('credit', { precision: 12, scale: 2 }).default('0').notNull(),
    netIncome: decimal('netIncome', { precision: 12, scale: 2 }).default('0').notNull(),
    expenses: decimal('expenses', { precision: 12, scale: 2 }).default('0').notNull(),
    netSavings: decimal('netSavings', { precision: 12, scale: 2 }).default('0').notNull(),
    netBurn: decimal('netBurn', { precision: 12, scale: 2 }).default('0').notNull(),
    savingsRate: decimal('savingsRate', { precision: 4, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
  },
  (monthlyAggregate) => ({
    userIdMonthIndex: uniqueIndex('userId_month_idx').on(
      monthlyAggregate.userId,
      monthlyAggregate.month
    ),
  })
);

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey().notNull(),
    date: timestamp('date', { mode: 'date', withTimezone: true }).notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: text('type').notNull(),
    bankAccountId: text('bankAccountId')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'cascade' }),
    categoryId: text('categoryId').references(() => categories.id),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isReconciled: boolean('isReconciled').default(false).notNull(),
    notes: text('notes'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()).notNull(),
    classificationJobId: text('classificationJobId').references(() => classificationJobs.id),
    isTrainingData: boolean('isTrainingData').default(false).notNull(),
    lunchMoneyCategory: text('lunchMoneyCategory'),
    lunchMoneyId: text('lunchMoneyId'),
    predictedCategory: text('predictedCategory'),
    similarityScore: decimal('similarityScore', { precision: 4, scale: 2 }),
    trainingJobId: text('trainingJobId').references(() => trainingJobs.id),
  },
  (transaction) => ({
    userIdLunchMoneyIdIndex: uniqueIndex('userId_lunchMoneyId_idx').on(
      transaction.userId,
      transaction.lunchMoneyId
    ),
  })
);

export const categoryExpenses = pgTable(
  'categoryExpenses',
  {
    id: text('id').primaryKey().notNull(),
    monthlyAggregateId: text('monthlyAggregateId')
      .notNull()
      .references(() => monthlyAggregates.id, { onDelete: 'cascade' }),
    categoryId: text('categoryId')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).$onUpdate(() => new Date()).notNull(),
  },
  (categoryExpense) => ({
    monthlyAggregateIdCategoryIdIndex: uniqueIndex(
      'monthlyAggregateId_categoryId_idx'
    ).on(categoryExpense.monthlyAggregateId, categoryExpense.categoryId),
  })
);

// TxClassify tables
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  data: text('data').notNull(),
  created_at: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date', withTimezone: true }).$onUpdate(() => new Date()),
  embedding_id: text('embedding_id').unique().notNull(),
  accountId: text('accountId').references(() => accounts.id),
  userId: text('userId').references(() => users.id),
});

export const webhookResults = pgTable('webhookResults', {
  id: uuid('id').primaryKey().defaultRandom(),
  prediction_id: text('prediction_id').unique().notNull(),
  results: json('results').notNull(),
  created_at: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow(),
});

// Relationships
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, { fields: [bankAccounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  categoryExpenses: many(categoryExpenses),
  transactions: many(transactions),
}));

export const trainingJobsRelations = relations(trainingJobs, ({ one, many }) => ({
  user: one(users, { fields: [trainingJobs.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const classificationJobsRelations = relations(classificationJobs, ({ one, many }) => ({
  user: one(users, { fields: [classificationJobs.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const monthlyAggregatesRelations = relations(monthlyAggregates, ({ one, many }) => ({
  user: one(users, { fields: [monthlyAggregates.userId], references: [users.id] }),
  categoryExpenses: many(categoryExpenses),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  bankAccount: one(bankAccounts, { fields: [transactions.bankAccountId], references: [bankAccounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  classificationJob: one(classificationJobs, { fields: [transactions.classificationJobId], references: [classificationJobs.id] }),
  trainingJob: one(trainingJobs, { fields: [transactions.trainingJobId], references: [trainingJobs.id] }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

export const categoryExpensesRelations = relations(categoryExpenses, ({ one }) => ({
  category: one(categories, { fields: [categoryExpenses.categoryId], references: [categories.id] }),
  monthlyAggregate: one(monthlyAggregates, {
    fields: [categoryExpenses.monthlyAggregateId],
    references: [monthlyAggregates.id],
  }),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  account: one(accounts, {
    fields: [embeddings.accountId],
    references: [accounts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  account: one(accounts, { fields: [subscriptions.accountId], references: [accounts.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  bankAccounts: many(bankAccounts),
  categories: many(categories),
  classificationJobs: many(classificationJobs),
  monthlyAggregates: many(monthlyAggregates),
  sessions: many(sessions),
  trainingJobs: many(trainingJobs),
  transactions: many(transactions),
})); 