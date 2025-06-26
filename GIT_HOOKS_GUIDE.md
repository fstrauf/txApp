# Automated Mobile UX Testing with Git Hooks

Your repository now has automatic mobile UX testing set up with Git hooks! Here's how it works:

## What Happens Automatically

### 🔍 **Pre-commit Hook** (Every Commit)
- **When**: Every time you run `git commit`
- **What**: Runs `pnpm test:mobile-quick` (takes ~30 seconds)
- **Tests**: Quick mobile UX checks on key pages
- **Result**: Commit is **blocked** if mobile UX issues are found

### 🚀 **Pre-push Hook** (Before Push)
- **When**: Every time you run `git push`
- **What**: Runs `pnpm test:mobile-all` (takes ~2-3 minutes)
- **Tests**: Comprehensive mobile UX tests on all devices
- **Result**: Push is **blocked** if mobile UX issues are found

## Normal Workflow

Your commits and pushes now automatically include mobile UX validation:

```bash
# 1. Make your changes
git add .

# 2. Commit (mobile UX tests run automatically)
git commit -m "feat: new feature"
# 🔍 Running Mobile UX checks before commit...
# ✅ All tests passed!

# 3. Push (comprehensive tests run automatically)
git push origin feature-branch
# 🚀 Running comprehensive Mobile UX tests before push...
# ✅ All tests passed!
```

## When Tests Fail

If mobile UX issues are detected, the commit/push will be blocked:

```bash
git commit -m "fix: update styles"
# 🔍 Running Mobile UX checks before commit...
# ❌ Small touch targets found (should be at least 44x44px):
#    "Save" (30x30px) - button.btn-sm
# ❌ Horizontal overflow detected on personal finance page!
#    Viewport width: 393px
#    Content width: 450px
#    Overflow by: 57px

# Commit blocked! Fix the issues and try again.
```

## Emergency Bypass (Use Sparingly)

If you need to commit/push without running tests (emergencies only):

```bash
# Skip pre-commit hook
git commit -m "emergency fix" --no-verify

# Skip pre-push hook  
git push --no-verify
```

⚠️ **Warning**: Only use `--no-verify` for genuine emergencies. Mobile UX issues can significantly impact user experience.

## Debugging Failed Tests

### 1. Use Interactive Mode
```bash
pnpm test:mobile-ui
```

### 2. Run Tests Manually
```bash
# Quick check
pnpm test:mobile-quick

# Full test suite
pnpm test:mobile-all
```

### 3. Check Specific Issues
The test output will tell you exactly what's wrong:
- **Horizontal overflow**: Element names and overflow amounts
- **Small touch targets**: Button names and current sizes  
- **Text readability**: Font sizes and affected elements
- **Edge spacing**: Elements too close to viewport edges

## Customizing the Hooks

### Modify Pre-commit Hook
Edit `.husky/pre-commit` to change what runs on commit:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running Mobile UX checks before commit..."

# You can modify this line:
pnpm test:mobile-quick

# Or add additional checks:
# pnpm lint
# pnpm type-check
```

### Modify Pre-push Hook
Edit `.husky/pre-push` to change what runs on push:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running comprehensive Mobile UX tests before push..."

# You can modify this line:
pnpm test:mobile-all

# Or change to quick tests for faster pushes:
# pnpm test:mobile-quick
```

## Disabling Hooks Temporarily

### Disable for One Developer
```bash
# Disable all hooks for current repository
git config core.hooksPath /dev/null

# Re-enable hooks
git config --unset core.hooksPath
```

### Disable for Entire Team
Remove or rename the `.husky` directory (not recommended).

## Best Practices

1. **Fix Issues Immediately**: Don't bypass the hooks unless it's a genuine emergency
2. **Run Tests During Development**: Use `pnpm test:mobile-quick` while coding
3. **Use Interactive Mode**: `pnpm test:mobile-ui` for detailed debugging
4. **Check Early and Often**: Better to catch issues during development than in hooks
5. **Communicate with Team**: If you bypass hooks, let the team know why

## Team Setup

When a new developer clones the repository:

```bash
# Clone and install
git clone <repo-url>
cd <repo-name>
pnpm install

# Hooks are automatically set up via the "prepare" script
# No additional setup needed!
```

## CI/CD Integration

The same tests can run in your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Mobile UX Tests
  run: pnpm test:mobile-quick

# For comprehensive testing
- name: Run Full Mobile UX Tests  
  run: pnpm test:mobile-all
```

---

**Result**: Your mobile UX quality is now automatically protected! 🛡️📱 