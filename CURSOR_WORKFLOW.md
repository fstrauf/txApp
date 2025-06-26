# Developer-Friendly Mobile UX → Cursor Workflow

This guide shows you how to extract mobile UX test results in a format that's perfect for feeding to Cursor AI assistant for automated fixes.

## Quick Workflow

### 1. Run Mobile UX Tests
```bash
# Run quick mobile UX tests
pnpm test:mobile-quick
```

### 2. Extract Issues for Cursor
```bash
# Generate developer-friendly report
pnpm mobile-issues
```

### 3. Copy & Paste to Cursor
Copy the output and paste it to Cursor with the provided prompt template.

## What You Get

The `pnpm mobile-issues` command generates a comprehensive report like this:

```
📋 MOBILE UX ISSUES REPORT FOR CURSOR
=====================================

📊 SUMMARY:
   Total Issues: 3
   Touch Target Size: 2 issue(s)
   Horizontal Overflow: 1 issue(s)

🐛 DETAILED ISSUES:
==================

1. TOUCH TARGET SIZE
   Test: Critical buttons should meet minimum touch size
   Details:
     ❌ Small touch targets found (should be at least 44x44px):
     "No, Thanks" (110x38px) - button.px-4
     "Yes, Notify Me!" (136x38px) - button.px-4

2. HORIZONTAL OVERFLOW
   Test: Personal finance page should not have horizontal overflow
   Details:
     ❌ Horizontal overflow detected!
     Viewport width: 393px
     Content width: 450px
     Overflow by: 57px

🛠️  CURSOR INSTRUCTIONS:
========================

Copy the above report and paste it to Cursor with this prompt:

"""
I have mobile UX issues detected by automated testing. Please help me fix these issues:

[PASTE THE DETAILED ISSUES SECTION ABOVE HERE]

Please:
1. Identify the specific components/files causing these issues
2. Provide exact code fixes for each issue
3. Ensure all solutions follow mobile UX best practices
4. Focus on responsive design and touch-friendly interfaces
"""

📁 LIKELY FILES TO CHECK:
=========================

Touch Target Size Issues (2):
  • src/app/components/buttons/**/*.tsx
  • src/app/personal-finance/components/**/*.tsx
  • src/components/ui/button.tsx
  • Navigation components
  • Look for: small buttons, tiny icons, insufficient padding

💡 COMMON FIXES:
================

• Horizontal Overflow: Use w-full, max-w-*, overflow-x-auto
• Small Touch Targets: Use min-h-[44px], p-3 or larger, tap-target-size
• Small Text: Use text-base (16px) minimum on mobile
• Edge Spacing: Use px-4, mx-auto, container classes
```

## Complete Workflow Example

### Step 1: Test & Extract Issues
```bash
# Run tests and extract issues in one go
pnpm test:mobile-quick && pnpm mobile-issues

# Or run them separately
pnpm test:mobile-quick
pnpm mobile-issues
```

### Step 2: Copy the Report
1. The script outputs a formatted report
2. Copy everything from "🐛 DETAILED ISSUES" section
3. Copy the suggested Cursor prompt

### Step 3: Paste to Cursor
Start a new Cursor conversation with:

```
I have mobile UX issues detected by automated testing. Please help me fix these issues:

1. TOUCH TARGET SIZE
   Test: Critical buttons should meet minimum touch size
   Details:
     ❌ Small touch targets found (should be at least 44x44px):
     "No, Thanks" (110x38px) - button.px-4
     "Yes, Notify Me!" (136x38px) - button.px-4

2. HORIZONTAL OVERFLOW
   Test: Personal finance page should not have horizontal overflow
   Details:
     ❌ Horizontal overflow detected!
     Viewport width: 393px
     Content width: 450px
     Overflow by: 57px

Please:
1. Identify the specific components/files causing these issues
2. Provide exact code fixes for each issue
3. Ensure all solutions follow mobile UX best practices
4. Focus on responsive design and touch-friendly interfaces
```

### Step 4: Apply Cursor's Fixes

Cursor will provide specific code changes. After applying them:

```bash
# Verify the fixes work
pnpm test:mobile-quick

# If issues remain, run the extraction again
pnpm mobile-issues
```

## Advanced Usage

### See Example Output
```bash
# See what the report looks like with sample data
node scripts/demo-mobile-issues.js
```

### Full Test Suite
```bash
# Run comprehensive tests on all devices
pnpm test:mobile-all

# Then extract issues
pnpm mobile-issues
```

### Interactive Debugging
```bash
# Open Playwright UI for manual investigation
pnpm test:mobile-ui
```

## Pro Tips

### 1. **Test Early, Fix Early**
```bash
# Run during development
pnpm test:mobile-quick
```

### 2. **Batch Fix Similar Issues**
The report groups issues by type, so you can fix all touch target issues at once, then all overflow issues, etc.

### 3. **Use File Guidance**
The report tells you which files to check for each issue type.

### 4. **Verify After Each Fix**
```bash
# Quick verification after fixes
pnpm test:mobile-quick
```

### 5. **Automatic Prevention**
Once set up, Git hooks prevent new mobile UX issues:
```bash
git commit  # Automatically runs mobile UX tests
```

## Common Issue Types & What Cursor Gets

| Issue Type | What Cursor Receives | Typical Fix |
|------------|---------------------|-------------|
| **Horizontal Overflow** | Exact viewport vs content width | `w-full`, `max-w-*`, `overflow-x-auto` |
| **Small Touch Targets** | Button names & current sizes | `min-h-[44px]`, `p-3`, touch-friendly padding |
| **Text Readability** | Font sizes & affected elements | `text-base` minimum, contrast improvements |
| **Edge Spacing** | Elements too close to edges | `px-4`, `mx-auto`, proper margins |

## Success Metrics

After Cursor applies fixes, you should see:

```bash
pnpm mobile-issues
# Output: ✅ No mobile UX issues found! All tests passed.
```

---

**Result**: Cursor gets all the context it needs to provide precise, actionable fixes for your mobile UX issues! 🎯 