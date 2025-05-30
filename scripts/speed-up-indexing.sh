#!/bin/bash

# Script to manually request indexing for all important URLs
# Run this after deploying to speed up Google's discovery

DOMAIN="https://www.expensesorted.com"

# Array of high-priority URLs to submit
URLS=(
    "/"
    "/personal-finance"
    "/demo"
    "/blog"
    "/pricing"
    "/integrations"
    "/api-landing"
    "/about"
    "/blog/private-expense-tracking-without-big-tech"
    "/blog/nz-budget-template-google-sheets-2025"
    "/blog/financial-wellness-beyond-budgets-true-freedom"
    "/blog/budgeting-apps-nz-privacy-guide-2025"
    "/blog/financial-freedom-trust-nz-guide-2025"
    "/blog/google-sheets-expense-tracker-template-ultimate-guide"
    "/blog/how-to-create-expense-tracker-google-sheets-tutorial"
    "/blog/savings-rate-calculator-path-to-financial-independence"
    "/blog/emergency-fund-calculator-how-much-do-you-need"
    "/blog/financial-runway-calculator-how-long-without-income"
)

echo "🚀 Speed up Google indexing for ExpenseSorted"
echo "==============================================="
echo ""

echo "📋 Manual steps to perform in Google Search Console:"
echo ""
echo "1. Go to https://search.google.com/search-console/"
echo "2. Select your property: $DOMAIN"
echo "3. Navigate to 'Sitemaps' and submit: $DOMAIN/sitemap.xml"
echo "4. Use 'URL Inspection' tool for these high-priority URLs:"
echo ""

for url in "${URLS[@]}"; do
    echo "   🔍 $DOMAIN$url"
done

echo ""
echo "For each URL above:"
echo "   - Enter URL in 'URL Inspection'"
echo "   - Click 'Request Indexing'"
echo "   - Wait for confirmation"
echo ""

echo "📧 Additional speed-up tactics:"
echo ""
echo "1. Share your content on social media (signals to Google it's important)"
echo "2. Get backlinks from other websites"
echo "3. Update content regularly to show it's fresh"
echo "4. Monitor Google Search Console for indexing status"
echo ""

echo "🔔 IndexNow notification (automatic):"
echo "   - Run: curl -X POST $DOMAIN/api/notify-index"
echo "   - This notifies Bing and other search engines immediately"
echo ""

echo "⏱️  Expected timeline:"
echo "   - High-priority pages: 1-3 days"
echo "   - Blog posts: 3-7 days"
echo "   - All pages: 1-2 weeks"
echo ""

echo "✅ Done! Monitor progress in Google Search Console."
