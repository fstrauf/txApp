import { Page, Locator, expect } from '@playwright/test';

/**
 * Mobile UX Testing Helper Functions
 * Utilities to detect mobile UX issues like overflows, small touch targets, etc.
 */

/**
 * Check for horizontal overflow (content spilling outside viewport)
 */
export async function checkForHorizontalOverflow(page: Page): Promise<void> {
  // Check document width vs viewport width
  const result = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    );
    const viewportWidth = window.innerWidth;
    
    const overflowingElements: Array<{
      tagName: string;
      className: string;
      id: string;
      width: number;
      left: number;
      right: number;
    }> = [];
    
    // Check all elements for overflow
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right > viewportWidth && rect.width > 0) {
        overflowingElements.push({
          tagName: element.tagName,
          className: element.className.toString(),
          id: element.id || '',
          width: rect.width,
          left: rect.left,
          right: rect.right,
        });
      }
    });
    
    return {
      documentWidth,
      viewportWidth,
      hasHorizontalOverflow: documentWidth > viewportWidth,
      overflowingElements: overflowingElements.slice(0, 10), // Limit to first 10
    };
  });
  
  if (result.hasHorizontalOverflow) {
    console.warn(`Horizontal overflow detected! Document width: ${result.documentWidth}px, Viewport: ${result.viewportWidth}px`);
    if (result.overflowingElements.length > 0) {
      console.warn('Overflowing elements:', result.overflowingElements);
    }
  }
  
  expect(result.hasHorizontalOverflow).toBe(false);
}

/**
 * Check that all clickable elements meet minimum touch target size (44x44px)
 */
export async function checkTouchTargets(page: Page): Promise<void> {
  const smallTargets = await page.evaluate(() => {
    const minSize = 44; // Minimum recommended touch target size
    const clickableSelectors = [
      'button',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      '[role="button"]',
      '[onclick]',
      '.cursor-pointer',
    ];
    
    const smallTargets: Array<{
      tagName: string;
      className: string;
      id: string;
      width: number;
      height: number;
      text: string;
    }> = [];
    
    clickableSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0 || computedStyle.display === 'none') {
          return;
        }
        
        if (rect.width < minSize || rect.height < minSize) {
          smallTargets.push({
            tagName: element.tagName,
            className: element.className.toString(),
            id: element.id || '',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: element.textContent?.slice(0, 50) || '',
          });
        }
      });
    });
    
    return smallTargets;
  });
  
  if (smallTargets.length > 0) {
    console.warn('Small touch targets found (< 44x44px):', smallTargets);
  }
  
  expect(smallTargets.length).toBe(0);
}

/**
 * Check for text that's too small to read on mobile (< 16px)
 */
export async function checkTextReadability(page: Page): Promise<void> {
  const smallText = await page.evaluate(() => {
    const minSize = 16; // Minimum readable font size on mobile
    const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, li, td, th, label');
    
    const smallTextElements: Array<{
      tagName: string;
      className: string;
      fontSize: number;
      text: string;
    }> = [];
    
    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      // Skip elements without text content or hidden elements
      const text = element.textContent?.trim();
      if (!text || computedStyle.display === 'none' || fontSize === 0) {
        return;
      }
      
      if (fontSize < minSize) {
        smallTextElements.push({
          tagName: element.tagName,
          className: element.className.toString(),
          fontSize: Math.round(fontSize),
          text: text.slice(0, 50),
        });
      }
    });
    
    return smallTextElements.slice(0, 20); // Limit to first 20
  });
  
  if (smallText.length > 0) {
    console.warn('Small text found (< 16px):', smallText);
  }
  
  expect(smallText.length).toBe(0);
}

/**
 * Check for elements that are positioned too close to viewport edges
 */
export async function checkViewportEdgeSpacing(page: Page): Promise<void> {
  const minEdgeSpacing = 16; // Minimum spacing from viewport edges
  
  const edgeViolations = await page.evaluate((minSpacing) => {
    const violations: Array<{
      tagName: string;
      className: string;
      issue: string;
      distance: number;
    }> = [];
    
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Skip hidden elements
      if (rect.width === 0 || rect.height === 0) return;
      
      // Check distances from edges
      const leftDistance = rect.left;
      const rightDistance = viewportWidth - rect.right;
      const topDistance = rect.top;
      const bottomDistance = viewportHeight - rect.bottom;
      
      if (leftDistance < minSpacing && leftDistance >= 0) {
        violations.push({
          tagName: element.tagName,
          className: element.className.toString(),
          issue: 'too close to left edge',
          distance: Math.round(leftDistance),
        });
      }
      
      if (rightDistance < minSpacing && rightDistance >= 0) {
        violations.push({
          tagName: element.tagName,
          className: element.className.toString(),
          issue: 'too close to right edge',
          distance: Math.round(rightDistance),
        });
      }
    });
    
    return violations.slice(0, 10);
  }, minEdgeSpacing);
  
  if (edgeViolations.length > 0) {
    console.warn('Elements too close to viewport edges:', edgeViolations);
  }
  
  expect(edgeViolations.length).toBe(0);
}

/**
 * Check for overlapping interactive elements
 */
export async function checkElementOverlaps(page: Page): Promise<void> {
  const overlaps = await page.evaluate(() => {
    const interactiveElements = Array.from(
      document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
    );
    
    const overlappingPairs: Array<{
      element1: string;
      element2: string;
      overlapArea: number;
    }> = [];
    
    for (let i = 0; i < interactiveElements.length; i++) {
      for (let j = i + 1; j < interactiveElements.length; j++) {
        const rect1 = interactiveElements[i].getBoundingClientRect();
        const rect2 = interactiveElements[j].getBoundingClientRect();
        
        // Skip hidden elements
        if (rect1.width === 0 || rect1.height === 0 || rect2.width === 0 || rect2.height === 0) {
          continue;
        }
        
        // Check for overlap
        const xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
        const overlapArea = xOverlap * yOverlap;
        
        if (overlapArea > 0) {
          overlappingPairs.push({
            element1: `${interactiveElements[i].tagName}.${interactiveElements[i].className}`,
            element2: `${interactiveElements[j].tagName}.${interactiveElements[j].className}`,
            overlapArea: Math.round(overlapArea),
          });
        }
      }
    }
    
    return overlappingPairs.slice(0, 5);
  });
  
  if (overlaps.length > 0) {
    console.warn('Overlapping interactive elements found:', overlaps);
  }
  
  expect(overlaps.length).toBe(0);
}

/**
 * Run all mobile UX checks on a page
 */
export async function runAllMobileUXChecks(page: Page): Promise<void> {
  await checkForHorizontalOverflow(page);
  await checkTouchTargets(page);
  await checkTextReadability(page);
  await checkViewportEdgeSpacing(page);
  await checkElementOverlaps(page);
}

/**
 * Wait for page to be fully loaded including images and fonts
 */
export async function waitForPageToLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for fonts to load
  await page.evaluate(() => {
    return document.fonts.ready;
  });
  
  // Small delay to ensure everything is rendered
  await page.waitForTimeout(1000);
} 