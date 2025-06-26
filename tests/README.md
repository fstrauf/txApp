# Test Suite

## Mobile UX Tests

This directory contains comprehensive mobile UX testing to catch common mobile issues before they reach production.

### Quick Commands

```bash
# Before every commit (30 seconds)
pnpm test:mobile-quick

# Full mobile testing (2-3 minutes)  
pnpm test:mobile-all

# Interactive debugging
pnpm test:mobile-ui

# Convenience script (auto-starts dev server)
./scripts/check-mobile-ux.sh
```

### Test Files

- `mobile-ux.spec.ts` - Comprehensive mobile UX tests for all pages and devices
- `quick-mobile-check.spec.ts` - Fast mobile UX checks for pre-commit workflow
- `utils/mobile-ux-helpers.ts` - Reusable mobile UX testing utilities

### What's Tested

- ✅ Horizontal overflow detection
- ✅ Touch target size validation (44x44px minimum)  
- ✅ Text readability (16px minimum)
- ✅ Viewport edge spacing
- ✅ Responsive layout behavior
- ✅ Table responsiveness
- ✅ Form mobile usability

### Test Results

The initial test run already found some issues:
- Small touch targets on navigation buttons
- Some buttons below the 44x44px minimum size

See [MOBILE_UX_TESTING.md](../MOBILE_UX_TESTING.md) for complete documentation. 