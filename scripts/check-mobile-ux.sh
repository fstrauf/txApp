#!/bin/bash

# Mobile UX Pre-commit Check Script
# Run this before committing to catch mobile UX issues

set -e

echo "🔍 Running Mobile UX Checks..."
echo "================================"

# Check if the dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Dev server is not running on localhost:3000"
    echo "   Starting dev server in background..."
    pnpm dev &
    DEV_PID=$!
    
    # Wait for server to start
    echo "   Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Dev server is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Dev server failed to start"
            kill $DEV_PID 2>/dev/null || true
            exit 1
        fi
        sleep 2
    done
else
    echo "✅ Dev server is already running"
fi

# Run quick mobile UX tests
echo ""
echo "🧪 Running quick mobile UX tests..."
echo "-----------------------------------"

if pnpm test:mobile-quick; then
    echo ""
    echo "🎉 All mobile UX checks passed!"
    echo ""
    echo "Available test commands:"
    echo "  pnpm test:mobile-quick  - Quick mobile UX check (current)"
    echo "  pnpm test:mobile        - Full mobile UX tests for Mobile Chrome"
    echo "  pnpm test:mobile-all    - Full mobile UX tests for all devices"
    echo "  pnpm test:mobile-ui     - Open Playwright UI for interactive testing"
    echo ""
else
    echo ""
    echo "❌ Mobile UX issues detected!"
    echo ""
    echo "Common fixes:"
    echo "  • Check for elements wider than their containers"
    echo "  • Ensure buttons are at least 44x44px"
    echo "  • Use responsive design classes (sm:, md:, lg:)"
    echo "  • Test with different screen sizes"
    echo ""
    echo "For detailed analysis, run:"
    echo "  pnpm test:mobile-ui"
    echo ""
    
    # Clean up background dev server if we started it
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null || true
    fi
    
    exit 1
fi

# Clean up background dev server if we started it
if [ ! -z "$DEV_PID" ]; then
    kill $DEV_PID 2>/dev/null || true
fi

echo "✨ Ready to commit!" 