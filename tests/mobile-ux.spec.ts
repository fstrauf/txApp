import { test, expect } from '@playwright/test';
import { runAllMobileUXChecks, waitForPageToLoad } from './utils/mobile-ux-helpers';

/**
 * Mobile UX Test Suite
 * Tests key pages for mobile UX issues like overflows, small touch targets, and poor readability
 */

const criticalPages = [
  { name: 'Home Page', path: '/' },
  { name: 'Personal Finance Dashboard', path: '/personal-finance' },
  { name: 'Lunch Money Integration', path: '/lunchmoney' },
  { name: 'Auth Signin', path: '/auth/signin' },
  { name: 'Auth Signup', path: '/auth/signup' },
  { name: 'Pricing', path: '/pricing' },
];

// Test each critical page across different mobile viewports
criticalPages.forEach(({ name, path }) => {
  test.describe(`${name} - Mobile UX`, () => {
    
    test('should have no horizontal overflow on mobile', async ({ page }) => {
      await page.goto(path);
      await waitForPageToLoad(page);
      
      // Check for horizontal overflow
      const result = await page.evaluate(() => {
        const documentWidth = Math.max(
          document.body.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
          document.documentElement.offsetWidth
        );
        const viewportWidth = window.innerWidth;
        return {
          documentWidth,
          viewportWidth,
          hasOverflow: documentWidth > viewportWidth
        };
      });
      
      if (result.hasOverflow) {
        console.error(`${name}: Horizontal overflow detected! Document width: ${result.documentWidth}px, Viewport: ${result.viewportWidth}px`);
      }
      
      expect(result.hasOverflow).toBe(false);
    });

    test('should have adequate touch targets', async ({ page }) => {
      await page.goto(path);
      await waitForPageToLoad(page);
      
      const smallTargets = await page.evaluate(() => {
        const minSize = 44;
        const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], .cursor-pointer');
        const violations: Array<{ element: string; width: number; height: number; text: string }> = [];
        
        clickableElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          
          // Skip hidden elements
          if (rect.width === 0 || rect.height === 0 || style.display === 'none') return;
          
          if (rect.width < minSize || rect.height < minSize) {
            violations.push({
              element: `${element.tagName}.${element.className}`,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              text: element.textContent?.slice(0, 30) || ''
            });
          }
        });
        
        return violations;
      });
      
      if (smallTargets.length > 0) {
        console.error(`${name}: Small touch targets found:`, smallTargets);
      }
      
      expect(smallTargets.length).toBe(0);
    });

    test('should have readable text sizes', async ({ page }) => {
      await page.goto(path);
      await waitForPageToLoad(page);
      
      const smallText = await page.evaluate(() => {
        const minSize = 16;
        const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, li, label');
        const violations: Array<{ element: string; fontSize: number; text: string }> = [];
        
        textElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const fontSize = parseFloat(style.fontSize);
          const text = element.textContent?.trim();
          
          // Skip elements without meaningful text or hidden elements
          if (!text || text.length < 3 || style.display === 'none') return;
          
          if (fontSize < minSize) {
            violations.push({
              element: `${element.tagName}.${element.className}`,
              fontSize: Math.round(fontSize),
              text: text.slice(0, 40)
            });
          }
        });
        
        return violations.slice(0, 10); // Limit output
      });
      
      if (smallText.length > 0) {
        console.error(`${name}: Small text found:`, smallText);
      }
      
      expect(smallText.length).toBe(0);
    });

    test('should have proper spacing from viewport edges', async ({ page }) => {
      await page.goto(path);
      await waitForPageToLoad(page);
      
      const edgeViolations = await page.evaluate(() => {
        const minSpacing = 12; // Minimum spacing from edges
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        const violations: Array<{ element: string; issue: string; distance: number }> = [];
        
        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // Skip hidden elements
          if (rect.width === 0 || rect.height === 0) return;
          
          const leftDistance = rect.left;
          const rightDistance = viewportWidth - rect.right;
          
          if (leftDistance < minSpacing && leftDistance >= 0) {
            violations.push({
              element: `${element.tagName}.${element.className}`,
              issue: 'too close to left edge',
              distance: Math.round(leftDistance)
            });
          }
          
          if (rightDistance < minSpacing && rightDistance >= 0) {
            violations.push({
              element: `${element.tagName}.${element.className}`,
              issue: 'too close to right edge',
              distance: Math.round(rightDistance)
            });
          }
        });
        
        return violations.slice(0, 5);
      });
      
      if (edgeViolations.length > 0) {
        console.error(`${name}: Edge spacing violations:`, edgeViolations);
      }
      
      expect(edgeViolations.length).toBe(0);
    });
  });
});

// Test responsive layout behavior
test.describe('Responsive Layout Tests', () => {
  
  test('should adapt layout from desktop to mobile', async ({ page }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/personal-finance');
    await waitForPageToLoad(page);
    
    // Capture desktop layout info
    const desktopLayout = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="grid"], [class*="flex"], nav, aside, main');
      return Array.from(elements).map(el => ({
        className: el.className,
        width: el.getBoundingClientRect().width,
        display: window.getComputedStyle(el).display
      }));
    });
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow layout to adjust
    
    // Capture mobile layout info
    const mobileLayout = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="grid"], [class*="flex"], nav, aside, main');
      return Array.from(elements).map(el => ({
        className: el.className,
        width: el.getBoundingClientRect().width,
        display: window.getComputedStyle(el).display
      }));
    });
    
    // Verify layout adapts (mobile should be narrower)
    expect(mobileLayout.length).toBeGreaterThan(0);
    
    // Check that no mobile elements exceed viewport width
    const overflowingElements = mobileLayout.filter(el => el.width > 375);
    if (overflowingElements.length > 0) {
      console.error('Elements overflowing mobile viewport:', overflowingElements);
    }
    expect(overflowingElements.length).toBe(0);
  });
  
  test('should handle extreme mobile viewport (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto('/personal-finance');
    await waitForPageToLoad(page);
    
    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      const documentWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      );
      return documentWidth > 320;
    });
    
    expect(hasOverflow).toBe(false);
    
    // Ensure interactive elements are still usable
    const interactiveElements = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
    
    for (const element of interactiveElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const box = await element.boundingBox();
        if (box) {
          // Check element doesn't overflow viewport
          expect(box.x + box.width).toBeLessThanOrEqual(320);
          // Check element is still reasonably sized
          expect(box.width).toBeGreaterThan(30);
          expect(box.height).toBeGreaterThan(30);
        }
      }
    }
  });
});

// Test specific components that commonly have mobile issues
test.describe('Common Mobile UX Problem Areas', () => {
  
  test('should handle tables responsively', async ({ page }) => {
    await page.goto('/personal-finance');
    await waitForPageToLoad(page);
    
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      const isVisible = await table.isVisible();
      if (isVisible) {
        const tableBox = await table.boundingBox();
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        
        if (tableBox) {
          // Table should not cause horizontal overflow
          expect(tableBox.width).toBeLessThanOrEqual(viewportWidth);
          
          // If table is wider than mobile, it should be scrollable
          if (tableBox.width > 300) {
            const hasHorizontalScroll = await page.evaluate((tableEl) => {
              const table = tableEl as HTMLElement;
              return table.scrollWidth > table.clientWidth;
            }, await table.elementHandle());
            
            // Either table fits or has horizontal scroll
            expect(hasHorizontalScroll || tableBox.width <= viewportWidth).toBe(true);
          }
        }
      }
    }
  });
  
  test('should handle navigation menus on mobile', async ({ page }) => {
    await page.goto('/');
    await waitForPageToLoad(page);
    
    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-expanded], .hamburger, [data-testid*="menu"]').first();
    
    if (await mobileMenuButton.isVisible()) {
      // Mobile menu should be properly sized
      const buttonBox = await mobileMenuButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
      
      // Click menu and check it doesn't cause overflow
      await mobileMenuButton.click();
      await page.waitForTimeout(300); // Allow animation
      
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      expect(hasOverflow).toBe(false);
    }
  });
  
  test('should handle forms on mobile', async ({ page }) => {
    await page.goto('/auth/signin');
    await waitForPageToLoad(page);
    
    // Check form inputs are properly sized
    const inputs = await page.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      const isVisible = await input.isVisible();
      if (isVisible) {
        const inputBox = await input.boundingBox();
        if (inputBox) {
          // Input should not cause horizontal overflow
          const viewportWidth = await page.evaluate(() => window.innerWidth);
          expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(viewportWidth);
          
          // Input should be tall enough for mobile interaction
          expect(inputBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
}); 