Here's the complete rewritten blog.ts file:

```typescript
import { marked } from 'marked';
import * as matter from 'gray-matter';
import { BlogPost } from '../schemas/blog';

const files = import.meta.glob('/src/content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const parseBlogPost = (content: string, filePath: string): BlogPost | null => {
  try {
    const { data: frontmatter, content: markdown } = matter(content);
    if (!frontmatter.title || !frontmatter.date || !frontmatter.excerpt) {
      console.warn(`Skipping ${filePath} - missing required frontmatter fields`);
      return null;
    }

    const html = marked.parse(markdown);
    const wordCount = markdown.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const slug = filePath.replace('/src/content/blog/', '').replace('.md', '');

    return {
      slug,
      title: frontmatter.title,
      date: new Date(frontmatter.date),
      excerpt: frontmatter.excerpt,
      html,
      readingTime,
      ...(frontmatter.tags && { tags: frontmatter.tags })
    };
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
};

const allPosts = Object.entries(files)
  .map(([path, content]) => parseBlogPost(content as string, path))
  .filter((post): post is BlogPost => post !== null)
  .sort((a, b) => b.date.getTime() - a.date.getTime());

export const getAllPosts = (): BlogPost[] => [...allPosts];

export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return allPosts.find((post) => post.slug === slug);
};
```