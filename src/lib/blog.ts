Here's the complete implementation of `src/lib/blog.ts`:

```typescript
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

const files = import.meta.glob('/src/content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function processPost([filePath, content]: [string, unknown]): BlogPost | null {
  try {
    if (typeof content !== 'string') {
      console.warn(`Invalid content type for ${filePath}`);
      return null;
    }

    const { data, content: body } = matter(content);
    
    if (!data.title || !data.date || !data.category || !data.excerpt || !data.author) {
      console.warn(`Missing required fields in ${filePath}`);
      return null;
    }

    const wordCount = body.split(/\s+/).length;
    const html = marked.parse(body);
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
      readingTime: Math.ceil(wordCount / 200),
      html
    };
  } catch (error) {
    console.warn(`Error processing ${filePath}:`, error);
    return null;
  }
}

export function getAllPosts(): BlogPost[] {
  const posts = Object.entries(files)
    .map(processPost)
    .filter((post): post is BlogPost => post !== null);

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.slug === slug) ?? null;
}
```