```typescript
import { readFileSync } from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import { marked } from 'marked';
import { join } from 'path';

interface BlogPostFrontmatter {
  title: string;
  date: string;
  category: string;
  excerpt: string;
  author: string;
}

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

const BLOG_CONTENT_PATH = join(process.cwd(), 'src/content/blog');

const validateFrontmatter = (data: unknown): data is BlogPostFrontmatter => {
  if (typeof data !== 'object' || data === null) return false;
  const requiredFields = ['title', 'date', 'category', 'excerpt', 'author'];
  return requiredFields.every(field => field in data);
};

const calculateReadingTime = (text: string): number => {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
};

const parseBlogPost = (filePath: string, slug: string): BlogPost | null => {
  try {
    const fileContents = readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!validateFrontmatter(data)) {
      console.warn(`Skipping ${filePath} - missing required frontmatter fields`);
      return null;
    }

    const html = marked(content);
    const readingTime = calculateReadingTime(content);

    return {
      slug,
      title: data.title,
      date: data.date,
      category: data.category,
      excerpt: data.excerpt,
      author: data.author,
      readingTime,
      html
    };
  } catch (error) {
    console.warn(`Error processing ${filePath}:`, error);
    return null;
  }
};

export const getAllPosts = async (): Promise<BlogPost[]> => {
  const files = await glob(join(BLOG_CONTENT_PATH, '**/*.md'));
  const posts = files
    .map(filePath => {
      const slug = filePath
        .replace(BLOG_CONTENT_PATH, '')
        .replace(/^\//, '')
        .replace(/\.md$/, '');
      return parseBlogPost(filePath, slug);
    })
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
};

export const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const filePath = join(BLOG_CONTENT_PATH, `${slug}.md`);
  try {
    return parseBlogPost(filePath, slug);
  } catch (error) {
    console.warn(`Error loading post ${slug}:`, error);
    return null;
  }
};
```