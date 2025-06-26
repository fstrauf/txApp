import { test, expect } from '@playwright/test';

/**
 * Quick Mobile UX Check
 * Fast tests that can be run before every commit to catch obvious mobile issues
 */

test.describe('Quick Mobile UX Check', () => {
  
  test('Home page should not have horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(() => {
      const bodyWidth = document.body.scrollWidth;
      const documentWidth = document.documentElement.scrollWidth;
      const viewportWidth = window.innerWidth;
      const maxWidth = Math.max(bodyWidth, documentWidth);
      
      return {
        viewportWidth,
        maxWidth,
        hasOverflow: maxWidth > viewportWidth,
        overflowAmount: maxWidth - viewportWidth
      };
    });
    
    if (result.hasOverflow) {
      console.error(`❌ Horizontal overflow detected on home page!`);
      console.error(`   Viewport width: ${result.viewportWidth}px`);
      console.error(`   Content width: ${result.maxWidth}px`);
      console.error(`   Overflow by: ${result.overflowAmount}px`);
    } else {
      console.log(`✅ No horizontal overflow on home page`);
    }
    
    expect(result.hasOverflow).toBe(false);
  });

  test('Personal finance page should not have horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/personal-finance');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(() => {
      const bodyWidth = document.body.scrollWidth;
      const documentWidth = document.documentElement.scrollWidth;
      const viewportWidth = window.innerWidth;
      const maxWidth = Math.max(bodyWidth, documentWidth);
      
      return {
        viewportWidth,
        maxWidth,
        hasOverflow: maxWidth > viewportWidth,
        overflowAmount: maxWidth - viewportWidth
      };
    });
    
    if (result.hasOverflow) {
      console.error(`❌ Horizontal overflow detected on personal finance page!`);
      console.error(`   Viewport width: ${result.viewportWidth}px`);
      console.error(`   Content width: ${result.maxWidth}px`);
      console.error(`   Overflow by: ${result.overflowAmount}px`);
    } else {
      console.log(`✅ No horizontal overflow on personal finance page`);
    }
    
    expect(result.hasOverflow).toBe(false);
  });

  test('Critical buttons should meet minimum touch size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]');
      const minSize = 44;
      const issues: Array<{
        text: string;
        width: number;
        height: number;
        selector: string;
      }> = [];
      
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        
        // Skip hidden elements
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0) {
          return;
        }
        
        if (rect.width < minSize || rect.height < minSize) {
          issues.push({
            text: button.textContent?.trim().slice(0, 30) || `Button ${index}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            selector: `${button.tagName.toLowerCase()}${button.className ? '.' + button.className.split(' ')[0] : ''}`
          });
        }
      });
      
      return issues.slice(0, 5); // Limit to first 5 issues
    });
    
    if (smallButtons.length > 0) {
      console.error(`❌ Small touch targets found (should be at least 44x44px):`);
      smallButtons.forEach(button => {
        console.error(`   "${button.text}" (${button.width}x${button.height}px) - ${button.selector}`);
      });
    } else {
      console.log(`✅ All buttons meet minimum touch size requirements`);
    }
    
    expect(smallButtons.length).toBe(0);
  });

  test('Should not have elements causing horizontal scroll', async ({ page }) => {
    await page.goto('/personal-finance');
    await page.waitForLoadState('networkidle');
    
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const viewportWidth = window.innerWidth;
      const issues: Array<{
        tagName: string;
        className: string;
        width: number;
        right: number;
        overflow: number;
      }> = [];
      
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        
        // Skip elements that are not visible or have no size
        if (rect.width === 0 || rect.height === 0) return;
        
        // Check if element extends beyond viewport
        if (rect.right > viewportWidth) {
          issues.push({
            tagName: element.tagName.toLowerCase(),
            className: element.className.toString().split(' ')[0] || '',
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            overflow: Math.round(rect.right - viewportWidth)
          });
        }
      });
      
      return issues.slice(0, 10); // Limit to first 10 issues
    });
    
    if (overflowElements.length > 0) {
      console.error(`❌ Elements causing horizontal overflow:`);
      overflowElements.forEach(el => {
        console.error(`   <${el.tagName}> (${el.className}) - ${el.width}px wide, extends ${el.overflow}px beyond viewport`);
      });
    } else {
      console.log(`✅ No elements causing horizontal overflow`);
    }
    
    expect(overflowElements.length).toBe(0);
  });
}); 