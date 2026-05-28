import matter from 'gray-matter';
import { marked } from 'marked';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  author: string;
  readingTime: number;
  html: string;
}

const files: Record<string, string> = import.meta.glob(
  '/src/content/blog/*.md',
  { eager: true, query: '?raw', import: 'default' }
);

function processPost(filePath: string, content: string): BlogPost | null {
  try {
    const { data, content: body } = matter(content);
    if (!data.title || !data.date || !data.category || !data.excerpt || !data.author) {
      console.warn(`Missing frontmatter in ${filePath}`);
      return null;
    }
    const html = marked.parse(body) as string;
    const readingTime = Math.ceil(body.split(/\s+/).length / 200);
    const slug = filePath
      .replace('/src/content/blog/', '')
      .replace('.md', '');
    return {
      slug,
      title: String(data.title),
      date: String(data.date),
      category: String(data.category),
      excerpt: String(data.excerpt),
      author: String(data.author),
      readingTime,
      html
    };
  } catch (e) {
    console.warn(`Error processing ${filePath}:`, e);
    return null;
  }
}

const allPosts: BlogPost[] = Object.entries(files)
  .map(([path, content]) => processPost(path, content))
  .filter((post): post is BlogPost => post !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

export function getAllPosts(): BlogPost[] {
  console.log('getAllPosts called, allPosts length:', allPosts.length);
  console.log('files keys:', Object.keys(files));
  return [...allPosts];
}

export function getPostBySlug(slug: string): BlogPost | null {
  return allPosts.find(post => post.slug === slug) ?? null;
}