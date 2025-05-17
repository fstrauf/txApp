import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const postsDirectory = path.join(process.cwd(), 'posts');

export interface PostData {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  author?: string;
  contentHtml?: string;
  [key: string]: any; // Allow other frontmatter fields
}

export function getSortedPostsData(): PostData[] {
  // Get file names under /posts
  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(postsDirectory);
  } catch (err) {
    // If the directory doesn't exist or is empty, return an empty array
    console.warn("Posts directory not found or empty. Blog will be empty.", err);
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map((fileName) => {
      // Remove ".md" or ".mdx" from file name to get slug
      const slug = fileName.replace(/\.(md|mdx)$/, '');

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents);

      // Combine the data with the id
      return {
        slug,
        title: matterResult.data.title || 'Untitled Post',
        date: matterResult.data.date || new Date().toISOString().split('T')[0],
        summary: matterResult.data.summary || '',
        author: matterResult.data.author || 'Anonymous',
        ...matterResult.data,
      } as PostData;
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getAllPostSlugs() {
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
      .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
      .map((fileName) => {
        return {
          params: {
            slug: fileName.replace(/\.(md|mdx)$/, ''),
          },
        };
      });
  } catch (err) {
    console.warn("Posts directory not found or empty. No slugs to generate.", err);
    return [];
  }
}

export async function getPostData(slug: string): Promise<PostData | null> {
  const fullPathMd = path.join(postsDirectory, `${slug}.md`);
  const fullPathMdx = path.join(postsDirectory, `${slug}.mdx`);
  
  let filePathToUse: string | undefined;
  let fileContents;

  if (fs.existsSync(fullPathMd)) {
    filePathToUse = fullPathMd;
  } else if (fs.existsSync(fullPathMdx)) {
    filePathToUse = fullPathMdx;
  }

  if (!filePathToUse) {
    return null; // Post not found
  }

  try {
    fileContents = fs.readFileSync(filePathToUse, 'utf8');
  } catch (err) {
    console.error(`Error reading post file for slug ${slug}:`, err);
    return null;
  }
  

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(remarkGfm)
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    slug,
    contentHtml,
    title: matterResult.data.title || 'Untitled Post',
    date: matterResult.data.date || new Date().toISOString().split('T')[0],
    summary: matterResult.data.summary || '',
    author: matterResult.data.author || 'Anonymous',
    ...matterResult.data,
  } as PostData;
} 