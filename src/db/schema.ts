import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Auth-related tables
export const users = pgTable('User', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  classifyApiKey: text('classifyApiKey'),
  lunchMoneyApiKey: text('lunchMoneyApiKey'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
});

export const accounts = pgTable(
  'Account',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: text('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    providerProviderAccountIdIndex: uniqueIndex('provider_provider_account_id_idx').on(
      account.provider,
      account.providerAccountId
    ),
  })
);

export const sessions = pgTable('Session', {
  id: text('id').primaryKey().notNull(),
  sessionToken: text('sessionToken').unique().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'VerificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

// Application-specific tables
export const bankAccounts = pgTable('BankAccount', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plaidItemId: text('plaidItemId'),
  plaidAccessToken: text('plaidAccessToken'),
  lastSync: timestamp('lastSync', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$onUpdate(() => new Date()).notNull(),
});

export const categories = pgTable(
  'Category',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isDefault: boolean('isDefault').default(false).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).$onUpdate(() => new Date()).notNull(),
  },
  (category) => ({
    nameUserIdIndex: uniqueIndex('name_userId_idx').on(category.name, category.userId),
  })
);

export const trainingJobs = pgTable('TrainingJob', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  predictionId: text('predictionId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  error: text('error'),
});

export const classificationJobs = pgTable('ClassificationJob', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  predictionId: text('predictionId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  error: text('error'),
});

export const monthlyAggregates = pgTable(
  'MonthlyAggregate',
  {
    id: text('id').primaryKey().notNull(),
    month: timestamp('month', { mode: 'date' }).notNull(),
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
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).$onUpdate(() => new Date()).notNull(),
  },
  (monthlyAggregate) => ({
    userIdMonthIndex: uniqueIndex('userId_month_idx').on(
      monthlyAggregate.userId,
      monthlyAggregate.month
    ),
  })
);

export const transactions = pgTable(
  'Transaction',
  {
    id: text('id').primaryKey().notNull(),
    date: timestamp('date', { mode: 'date' }).notNull(),
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
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).$onUpdate(() => new Date()).notNull(),
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
  'CategoryExpense',
  {
    id: text('id').primaryKey().notNull(),
    monthlyAggregateId: text('monthlyAggregateId')
      .notNull()
      .references(() => monthlyAggregates.id, { onDelete: 'cascade' }),
    categoryId: text('categoryId')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).$onUpdate(() => new Date()).notNull(),
  },
  (categoryExpense) => ({
    monthlyAggregateIdCategoryIdIndex: uniqueIndex(
      'monthlyAggregateId_categoryId_idx'
    ).on(categoryExpense.monthlyAggregateId, categoryExpense.categoryId),
  })
);

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