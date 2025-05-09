# TransactionList.tsx Refactoring Plan

## Goal
Refactor the `TransactionList.tsx` component to improve maintainability, readability, and separation of concerns by moving logic into custom hooks. No changes to existing functionality should be introduced during the refactor.

## Task List

### Phase 1: UI Feedback and Core Data Management

- [x] **1. Refactor Toast Notifications (`useToast`)**
    - [x] Move `toastMessage` state and `setToastMessage` logic from `TransactionList.tsx` into the existing `useToast` hook.
    - [x] Ensure `useToast` handles auto-hiding of toast messages (currently an `useEffect` in `TransactionList.tsx`).
    - [x] Update `TransactionList.tsx` to call `showSuccess`, `showError`, `showInfo` functions exposed by `useToast`.
    - [x] Pass necessary toast message state from `useToast` to the `ToastNotification` component.

- [x] **2. Refactor Transaction Selection Logic (`useSelection`)**
    - [x] Replace `selectedTransactions` state in `TransactionList.tsx` with `selectedIds` (or equivalent) from `useSelection`.
    - [x] Replace `handleSelectTransaction` in `TransactionList.tsx` with `toggleSelection` (or `toggleSelectionWithRange`) from `useSelection`.
    - [x] Adapt `handleSelectAll` in `TransactionList.tsx` to use `selectAll` from `useSelection`, ensuring it operates correctly on the currently displayed/fetched transactions.
    - [x] `TransactionList.tsx` and its child components will consume selection state and functions from `useSelection`.

- [ ] **3. Refactor Transaction Data Management (`useTransactionData` with TanStack Query)**
    - [x] **3.A. Verify TanStack Query Setup:**
        - [x] Confirm `QueryClient` and `QueryClientProvider` are properly configured at the application root.
    - [x] **3.B. Refactor Transaction Fetching in `useTransactionData` with `useQuery`:**
        - [x] `useTransactionData` (or a new dedicated hook like `useLunchMoneyQueries`) will manage user-driven filter states (`dateRange`, `statusFilter`).
        - [x] Implement `useQuery` for fetching transactions from `/api/lunch-money/transactions`.
            - Query key: dynamic (e.g., `['lunchMoneyTransactions', dateRange, statusFilter]`)
            - Replaces existing manual fetching for the main transaction list.
        - [x] Client-side filtering/sorting (if retained from current `useTransactionData.ts`) will operate on `data` from `useQuery`.
    - [x] **3.C. Refactor Category Fetching in `useTransactionData` with `useQuery`:**
        - [x] Implement `useQuery` for fetching categories from `/api/lunch-money/categories`.
            - Query key: (e.g., `['lunchMoneyCategories']`)
            - Replaces existing category fetching logic.
    - [x] **3.D. Refactor Total Counts Fetching with `useQuery`:**
        - [x] Implement `useQuery` for fetching transaction counts from `/api/lunch-money/transaction-counts`.
            - Query key: dynamic (e.g., `['lunchMoneyTransactionCounts', dateRange]`)
            - Replaces `fetchTotalCounts` function; counts derived from `useQuery` data.
    - [x] **3.E. Adapt Data Modification Callbacks & Query Invalidation:**
        - [x] Functions that modify data (e.g., manual category changes, note updates, actions from `useTraining`, `useCategorization` etc.) will, after successful API calls, invalidate relevant queries (e.g., `queryClient.invalidateQueries(['lunchMoneyTransactions', ...])`) to trigger refetches.
        - [x] Consider `useMutation` for these update operations for better state management of mutations.
        - [x] Review `updateTransaction` / `updateTransactions` in `useTransactionData.ts` for their role (optimistic updates vs. simple invalidation).
    - [x] **3.F. Update `TransactionList.tsx` Data Consumption:**
        - [x] `TransactionList.tsx` will consume `data`, `isLoading`, `isError`, etc., provided by the `useQuery` instances via the refactored `useTransactionData` hook.
    - [x] **3.G. Update Dependent Hooks for Query Invalidation:**
        - [x] Hooks like `useTraining`, `useCategorization`, and newly created action-specific hooks will need access to the `queryClient` (via `useQueryClient()`) to call `invalidateQueries`.

### Phase 2: Core Operations Logic

- [x] **4. Refactor AI Operations (`useTraining` as Hub)**
    - [x] **Centralize Operation State:**
        - [x] The `operationState` from `useTraining` (managing `inProgress`, `type`, `progress`, `result`) will drive the `ProgressModal` in `TransactionList.tsx`.
        - [x] Remove `operationInProgress`, `operationType`, `progressPercent`, `progressMessage`, `isOperationComplete`, `closeModal` states/functions from `TransactionList.tsx` in favor of `useTraining`'s state and reset/close mechanisms.
    - [x] **Polling:**
        - [x] Consolidate all polling logic into `useTraining`'s `pollForCompletion`.
    - [x] **Training Logic:**
        - [x] Move the logic from `handleTrainSelected` in `TransactionList.tsx` into `useTraining` (e.g., as `trainSelectedWithUIUpdates` or similar, using the hook's internal `handleTrainModel`).
        - [x] Move the logic from `handleTrainAllReviewed` in `TransactionList.tsx` into `useTraining`. This will involve fetching 'cleared' transactions and then using the hook's training and polling mechanisms.
    - [x] **AI Categorization Trigger:**
        - [x] Move the logic from `handleCategorizeSelected` in `TransactionList.tsx` into `useTraining` (e.g., as `categorizeSelectedWithUIUpdates` or similar, using the hook's internal `handleCategorizeTransactions`). This function in `useTraining` will then call `updateTransactionsWithPredictions` from `useCategorization` upon success.
    - [x] **Tagging:**
        - [x] `useTraining` will internally use its `tagTransactionsAsTrained` function as needed after successful training operations.
    - [x] **Other:**
        - [x] Move `fetchLastTrainedTimestamp` logic into `useTraining`.
    - [x] **Dependencies:** `useTraining` will require `showToast`, `updateTransactions`, context for `transactions`, `categories`, `selectedIds`.

- [x] **5. Refactor Prediction Application Logic (`useCategorization`)**
    - [x] **State Management:**
        - [x] Replace `pendingCategoryUpdates`, `applyingAll`, `applyingIndividual`, `successfulUpdates` states in `TransactionList.tsx` with `categorizationState` from `useCategorization`.
    - [x] **Core Functions:**
        - [x] `TransactionList.tsx` will use `applyPredictedCategory` (for single application) and `applyAllPredictedCategories` from `useCategorization`.
        - [x] The `updateTransactionsWithPredictions` function in `useCategorization` will be called by `useTraining` after the AI returns categorization results.
        - [x] Move `cancelSinglePrediction` logic from `TransactionList.tsx` into `useCategorization`.
    - [x] **Dependencies:** `useCategorization` will require `showToast`, `updateTransaction`, context for `categories`.

### Phase 3: Component-Specific Actions & Admin Logic

- [x] **6. Consolidate Category Utilities (`useCategory` / `useTransactionData`)**
    - [x] Review `useCategory`. (Assumed not needed for this specific function as it fits well in useTransactionData)
    - [x] Move `getCategoryNameById` from `TransactionList.tsx` into either `useTransactionData` (if it primarily provides categories) or `useCategory` (if that hook is intended for more category-specific utilities).

- [x] **7. Create `useManualTransactionActions` Hook (New)**
    - [x] **Responsibilities:**
        - [x] Move `handleCategoryChange` (manual user update of a transaction's category) from `TransactionList.tsx` to this new hook.
        - [x] Move `handleNoteChange` (updating transaction notes) from `TransactionList.tsx` to this new hook.
    - [x] **Dependencies:** `showToast` (from `useToast`), `updateTransaction` (from `useTransactionData`).

- [x] **8. Create `useAdminOperations` Hook (New)**
    - [x] **Responsibilities:**
        - [x] Move `isAdminMode` and `filterNoPayee` states and their setters from `TransactionList.tsx` to this new hook.
        - [x] Move `handleTransferOriginalNames` function from `TransactionList.tsx` to this new hook.
    - [x] **Dependencies:** `showToast` (from `useToast`), `updateTransactions` (from `useTransactionData`), `selectedIds` (from `useSelection`), `transactions` (from `useTransactionData`).

### Phase 4: Finalizing `TransactionList.tsx`

- [x] **9. Simplify `TransactionList.tsx`**
    - [x] The `TransactionList.tsx` component should primarily initialize the new/refactored hooks.
    - [x] It will pass state and functions from these hooks to the appropriate child UI components (`ToastNotification`, `ProgressModal`, `TransactionFilters`, `CategorizationControls`, `TransactionTable`).
    - [x] Remove all direct state management (useState, useCallback for complex functions) and effects (useEffect for business logic) that have been moved to hooks.
    - [x] The `displayedTransactions` memoized calculation (for admin filter) can remain in `TransactionList.tsx` or be moved if a more suitable hook emerges (e.g. if `useTransactionData` starts handling more complex display filtering).

---
