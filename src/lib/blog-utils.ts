import 'server-only';
import { globby } from 'globby';
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';

export interface BlogPostMetadata {
  title: string;
  date: string;
  summary: string;
  slug: string;
  // Add other frontmatter fields you expect, e.g., tags, author, etc.
}

export async function getLatestPosts(): Promise<BlogPostMetadata[]> {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const files = await globby(['*.mdx', '*.md'], { cwd: blogDir });

  const posts: BlogPostMetadata[] = [];

  for (const file of files) { // Iterate through all files to sort by date later
    const filePath = path.join(blogDir, file);
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const { data: metadata } = matter(rawContent);

    // Basic validation for essential metadata
    if (metadata.title && metadata.date && metadata.summary) {
      posts.push({
        slug: file.replace(/\.(mdx|md)$/, ''),
        title: metadata.title,
        date: metadata.date,
        summary: metadata.summary,
        // Add other metadata fields here if they exist
        ...(metadata as Omit<BlogPostMetadata, 'slug' | 'title' | 'date' | 'summary'>)
      });
    }
  }

  // Sort posts by date in descending order
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Return only the 3 latest, or fewer if not enough
  return posts.slice(0, 3);
}

export interface BlogPost extends BlogPostMetadata {
  content: string;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const filePathMDX = path.join(blogDir, `${slug}.mdx`);
  const filePathMD = path.join(blogDir, `${slug}.md`);

  let filePath;
  try {
    await fs.access(filePathMDX); // Check if .mdx file exists
    filePath = filePathMDX;
  } catch (mdxError) {
    try {
      await fs.access(filePathMD); // Check if .md file exists
      filePath = filePathMD;
    } catch (mdError) {
      console.error(`Error finding post: ${slug}. MDX error: ${mdxError}, MD error: ${mdError}`);
      return null; // Post not found
    }
  }

  try {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const { data: metadata, content } = matter(rawContent);

    if (metadata.title && metadata.date) { // Ensure essential metadata exists
      return {
        slug,
        title: metadata.title,
        date: metadata.date,
        summary: metadata.summary || '', // Summary might be optional for a single post view
        ...(metadata as Omit<BlogPostMetadata, 'slug' | 'title' | 'date' | 'summary'>),
        content,
      };
    }
    return null; // Missing essential metadata
  } catch (error) {
    console.error(`Error reading or parsing post ${slug}:`, error);
    return null;
  }
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const files = await globby(['*.mdx', '*.md'], { cwd: blogDir });
  return files.map(file => ({ slug: file.replace(/\.(mdx|md)$/, '') }));
}

export async function getAllPosts(): Promise<BlogPostMetadata[]> {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const files = await globby(['*.mdx', '*.md'], { cwd: blogDir });

  const posts: BlogPostMetadata[] = [];

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const { data: metadata } = matter(rawContent);

    if (metadata.title && metadata.date && metadata.summary) {
      posts.push({
        slug: file.replace(/\.(mdx|md)$/, ''),
        title: metadata.title,
        date: metadata.date,
        summary: metadata.summary,
        ...(metadata as Omit<BlogPostMetadata, 'slug' | 'title' | 'date' | 'summary'>),
      });
    }
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

// We will create getAllPosts later 