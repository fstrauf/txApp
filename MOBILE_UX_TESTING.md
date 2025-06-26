# Mobile UX Testing Setup

This project includes comprehensive mobile UX testing to catch common mobile issues like horizontal overflows, small touch targets, and poor readability before they reach production.

## Quick Start

### Before Every Commit (Recommended)
```bash
# Quick mobile UX check (takes ~30 seconds)
pnpm test:mobile-quick
```

### Or use the convenience script
```bash
# Automatically starts dev server if needed
./scripts/check-mobile-ux.sh
```

## Available Test Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `pnpm test:mobile-quick` | Fast mobile UX checks on key pages | Before every commit |
| `pnpm test:mobile` | Full mobile tests on Mobile Chrome | Before PR/release |
| `pnpm test:mobile-all` | Full tests on all mobile devices | Comprehensive testing |
| `pnpm test:mobile-ui` | Interactive Playwright UI | Debugging/development |

## What Gets Tested

### 1. Horizontal Overflow Detection
- ✅ Detects content that spills outside the viewport
- ✅ Identifies specific elements causing overflow
- ✅ Provides exact measurements for debugging

### 2. Touch Target Validation
- ✅ Ensures buttons/links are at least 44x44px
- ✅ Checks all interactive elements
- ✅ Reports undersized targets with their current size

### 3. Text Readability
- ✅ Validates text is at least 16px on mobile
- ✅ Identifies hard-to-read small text
- ✅ Focuses on meaningful content

### 4. Viewport Edge Spacing
- ✅ Checks elements aren't too close to screen edges
- ✅ Ensures comfortable touch margins
- ✅ Validates interactive element positioning

### 5. Responsive Layout Behavior
- ✅ Tests layout adaptation across viewports
- ✅ Validates extreme mobile sizes (320px)
- ✅ Checks table responsiveness

## Test Coverage

The tests cover these critical pages:
- Home page (`/`)
- Personal Finance Dashboard (`/personal-finance`)
- Lunch Money Integration (`/lunchmoney`)
- Authentication pages (`/auth/signin`, `/auth/signup`)
- Pricing page (`/pricing`)

## Mobile Viewports Tested

| Device | Viewport Size | Use Case |
|--------|---------------|----------|
| iPhone SE | 320×568px | Extreme mobile |
| iPhone 12 | 390×844px | Modern mobile |
| Pixel 5 | 393×851px | Android mobile |
| iPad Pro | 1024×1366px | Tablet |

## Common Issues & Fixes

### Horizontal Overflow
```typescript
// ❌ Problem: Fixed width elements
<div style={{width: '500px'}}>Too wide for mobile</div>

// ✅ Solution: Responsive width
<div className="w-full max-w-md">Responsive width</div>
```

### Small Touch Targets
```typescript
// ❌ Problem: Tiny buttons
<button className="p-1 text-xs">Save</button>

// ✅ Solution: Adequate padding
<button className="p-3 text-base min-h-[44px]">Save</button>
```

### Text Too Small
```typescript
// ❌ Problem: Tiny text
<p className="text-xs">Important information</p>

// ✅ Solution: Readable text
<p className="text-base">Important information</p>
```

## Integration with Git Workflow

### Option 1: Manual Check
```bash
# Before committing
pnpm test:mobile-quick
git add .
git commit -m "feat: new mobile-friendly feature"
```

### Option 2: Git Hook (Recommended)
```bash
# Install husky for git hooks
pnpm add -D husky

# Add pre-commit hook
echo "pnpm test:mobile-quick" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Debugging Test Failures

### 1. Use Playwright UI for Investigation
```bash
pnpm test:mobile-ui
```

### 2. Check Console Output
The tests provide detailed error messages:
```
❌ Horizontal overflow detected on personal finance page!
   Viewport width: 393px
   Content width: 450px
   Overflow by: 57px
```

### 3. Common Debug Steps
1. Open browser dev tools (F12)
2. Switch to mobile view (Ctrl+Shift+M)
3. Set viewport to 393×851 (Pixel 5)
4. Look for horizontal scrollbar
5. Use Elements tab to identify wide elements

## Performance Notes

- **Quick tests**: ~30 seconds (runs on single device)
- **Full tests**: ~2-3 minutes (runs on all devices)
- **Tests run headless**: No browser windows open during testing
- **Automatic server management**: Tests start/stop dev server as needed

## Troubleshooting

### Dev Server Issues
```bash
# If tests fail to connect to localhost:3000
pnpm dev  # In one terminal
pnpm test:mobile-quick  # In another terminal
```

### Test Timeout Issues
```bash
# Increase timeout for slow pages
PLAYWRIGHT_TIMEOUT=60000 pnpm test:mobile-quick
```

### Specific Page Testing
```bash
# Test only specific files
pnpm playwright test quick-mobile-check.spec.ts --grep "Home page"
```

## Best Practices

1. **Run quick tests before every commit**
2. **Run full tests before merging PRs**
3. **Use Playwright UI for debugging**
4. **Fix mobile issues immediately** (easier than debugging later)
5. **Test on real devices** for final validation

## CI/CD Integration

Add to your GitHub Actions workflow:
```yaml
- name: Run Mobile UX Tests
  run: pnpm test:mobile-quick
```

---

*This testing setup helps maintain excellent mobile UX by catching issues early in the development cycle.* 