#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extract Mobile UX Issues for Cursor
 * 
 * This script processes Playwright test results and formats them
 * in a developer-friendly way for feeding to Cursor AI assistant.
 */

function extractMobileIssues() {
  console.log('🔍 Extracting Mobile UX Issues for Cursor...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    summary: {
      totalIssues: 0,
      categories: {}
    }
  };

  // Check for test results directory
  const testResultsDir = './test-results';
  const playwrightReportDir = './playwright-report';
  
  if (!fs.existsSync(testResultsDir) && !fs.existsSync(playwrightReportDir)) {
    console.log('❌ No test results found. Run mobile UX tests first:');
    console.log('   pnpm test:mobile-quick');
    return;
  }

  // Look for error context files
  if (fs.existsSync(testResultsDir)) {
    try {
      const testDirs = fs.readdirSync(testResultsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const testDir of testDirs) {
        const errorContextPath = path.join(testResultsDir, testDir, 'error-context.md');
        if (fs.existsSync(errorContextPath)) {
          const errorContent = fs.readFileSync(errorContextPath, 'utf-8');
          
          // Parse test name and issue type
          const testName = testDir.replace(/quick-mobile-check-Quick-M-\w+-/, '').replace(/-Mobile-Chrome$/, '');
          const issueType = categorizeIssue(testName);
          
          report.issues.push({
            testName: testName,
            issueType: issueType,
            details: errorContent,
            directory: testDir
          });
          
          report.summary.totalIssues++;
          report.summary.categories[issueType] = (report.summary.categories[issueType] || 0) + 1;
        }
      }
    } catch (error) {
      console.log('⚠️  Error reading test results:', error.message);
    }
  }

  // Generate developer-friendly report
  generateCursorReport(report);
}

function categorizeIssue(testName) {
  if (testName.includes('overflow') || testName.includes('horizontal')) {
    return 'Horizontal Overflow';
  } else if (testName.includes('touch') || testName.includes('size')) {
    return 'Touch Target Size';
  } else if (testName.includes('text') || testName.includes('readable')) {
    return 'Text Readability';
  } else if (testName.includes('edge') || testName.includes('spacing')) {
    return 'Edge Spacing';
  } else {
    return 'Other Mobile UX';
  }
}

function generateCursorReport(report) {
  console.log('📋 MOBILE UX ISSUES REPORT FOR CURSOR');
  console.log('=====================================\n');
  
  if (report.summary.totalIssues === 0) {
    console.log('✅ No mobile UX issues found! All tests passed.\n');
    return;
  }

  console.log(`📊 SUMMARY:`);
  console.log(`   Total Issues: ${report.summary.totalIssues}`);
  for (const [category, count] of Object.entries(report.summary.categories)) {
    console.log(`   ${category}: ${count} issue(s)`);
  }
  console.log();

  console.log('🐛 DETAILED ISSUES:');
  console.log('==================\n');

  report.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.issueType.toUpperCase()}`);
    console.log(`   Test: ${issue.testName}`);
    console.log(`   Details:`);
    
    // Parse and format the error details
    const lines = issue.details.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        console.log(`     ${line.trim()}`);
      }
    });
    console.log();
  });

  console.log('🛠️  CURSOR INSTRUCTIONS:');
  console.log('========================\n');
  
  console.log('Copy the above report and paste it to Cursor with this prompt:');
  console.log();
  console.log('"""');
  console.log('I have mobile UX issues detected by automated testing. Please help me fix these issues:');
  console.log();
  console.log('[PASTE THE DETAILED ISSUES SECTION ABOVE HERE]');
  console.log();
  console.log('Please:');
  console.log('1. Identify the specific components/files causing these issues');
  console.log('2. Provide exact code fixes for each issue');
  console.log('3. Ensure all solutions follow mobile UX best practices');
  console.log('4. Focus on responsive design and touch-friendly interfaces');
  console.log('"""');
  console.log();
  
  // Generate file-specific guidance
  generateFileGuidance(report);
}

function generateFileGuidance(report) {
  console.log('📁 LIKELY FILES TO CHECK:');
  console.log('=========================\n');
  
  const fileGuidance = {
    'Horizontal Overflow': [
      'src/app/personal-finance/components/**/*.tsx',
      'src/app/personal-finance/page.tsx',
      'src/app/components/**/*.tsx',
      'tailwind.config.js (check responsive breakpoints)',
      'Look for: fixed widths, large containers, tables, wide forms'
    ],
    'Touch Target Size': [
      'src/app/components/buttons/**/*.tsx',
      'src/app/personal-finance/components/**/*.tsx',
      'src/components/ui/button.tsx',
      'Navigation components',
      'Look for: small buttons, tiny icons, insufficient padding'
    ],
    'Text Readability': [
      'Global CSS files',
      'Component styles with text-xs, text-sm classes',
      'tailwind.config.js (font size configuration)',
      'Look for: small font sizes, poor contrast, tiny labels'
    ],
    'Edge Spacing': [
      'Layout components',
      'Page containers',
      'Modal/dialog components',
      'Look for: elements too close to viewport edges'
    ]
  };

  for (const [category, count] of Object.entries(report.summary.categories)) {
    if (fileGuidance[category]) {
      console.log(`${category} Issues (${count}):`);
      fileGuidance[category].forEach(file => {
        console.log(`  • ${file}`);
      });
      console.log();
    }
  }
  
  console.log('💡 COMMON FIXES:');
  console.log('================\n');
  console.log('• Horizontal Overflow: Use w-full, max-w-*, overflow-x-auto');
  console.log('• Small Touch Targets: Use min-h-[44px], p-3 or larger, tap-target-size');
  console.log('• Small Text: Use text-base (16px) minimum on mobile');
  console.log('• Edge Spacing: Use px-4, mx-auto, container classes');
  console.log();
  
  console.log('🔧 TESTING AFTER FIXES:');
  console.log('=======================\n');
  console.log('Run these commands to verify fixes:');
  console.log('1. pnpm test:mobile-quick    # Quick validation');
  console.log('2. pnpm test:mobile-ui       # Interactive debugging');
  console.log('3. Open browser dev tools → mobile view → check manually');
  console.log();
}

// Run the script
extractMobileIssues(); 