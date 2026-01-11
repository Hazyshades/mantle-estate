export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  readingTime: string;
  author: string;
  excerpt?: string;
  featured?: boolean;
}

const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "testnet",
    title: "Testnet",
    category: "announcement",
    date: formatDate(new Date()),
    readingTime: "5 min",
    author: "Mantle Estate Team",
    featured: true,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  // Return posts in the order they are defined (newest first)
  return [...blogPosts];
}

