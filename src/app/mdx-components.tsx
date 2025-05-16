import Image from 'next/image';
import Link from 'next/link';
import React from 'react'; // Import React for createElement

// Slugify function
function slugify(str: string): string {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

// Function to create heading components with anchor links
function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const HeadingComponent = ({ children }: { children?: React.ReactNode }) => {
    const textContent = React.Children.toArray(children).join('');
    const slug = slugify(textContent);

    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement(
          'a',
          {
            href: `#${slug}`,
            key: `link-${slug}`,
            className: 'anchor',
            style: { textDecoration: 'none', marginRight: '0.5em', color: 'inherit' } // Optional: basic styling for the anchor
          },
          '#' // You can use an icon or symbol here
        ),
        children,
      ]
    );
  };

  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

// Simplified custom table component
function table({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', marginBlock: '1em' }}> {/* Responsive wrapper */}
      <table style={{ minWidth: '100%' }}>{/* Ensure prose can apply full-width styling */}
        {children}
      </table>
    </div>
  );
}

// This object can be passed to MDXRemote in your page files
export const customMDXComponents = {
  // h1: createHeading(1), // Temporarily commented out
  // h2: createHeading(2), // Temporarily commented out
  // h3: createHeading(3), // Temporarily commented out
  // h4: createHeading(4), // Temporarily commented out
  // h5: createHeading(5), // Temporarily commented out
  // h6: createHeading(6), // Temporarily commented out
  img: (props: JSX.IntrinsicElements['img']) => {
    const { alt, src, width, height, ref, ...rest } = props;
    
    if (!src || typeof src !== 'string') {
      // Optionally return a placeholder or null if src is not a valid string
      // console.warn('Image component in MDX received invalid src:', src);
      return null; 
    }

    const numWidth = typeof width === 'string' ? parseInt(width, 10) : typeof width === 'number' ? width : undefined;
    const numHeight = typeof height === 'string' ? parseInt(height, 10) : typeof height === 'number' ? height : undefined;

    if (typeof numWidth === 'number' && typeof numHeight === 'number' && !isNaN(numWidth) && !isNaN(numHeight)) {
      // Ensure src is string for NextImage
      return <Image alt={alt || ''} src={src as string} width={numWidth} height={numHeight} {...rest} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ width: '100%', height: 'auto' }}/>;
    }

    return (
      <Image 
        alt={alt || ''} 
        src={src as string} 
        width={800} 
        height={600} 
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ width: '100%', height: 'auto' }} 
        {...rest}
      />
    );
  },
  a: (props: JSX.IntrinsicElements['a']) => {
    const { href, ref, ...rest } = props;

    if (typeof href === 'string' && (href.startsWith('/') || href.startsWith('#'))) {
      if (href.startsWith('#')) { // If it's an internal anchor link, just use <a>
        return <a href={href} {...rest} />;
      }
      return <Link href={href} {...rest} />;
    }
    // For external links or non-string hrefs that are valid for <a> but not <Link>
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
  },
  table, // Use the new simplified 'table' component
  // You can add other custom components here as needed
}; 