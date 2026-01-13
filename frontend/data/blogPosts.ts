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
    slug: "mantle-estate-v0.1",
    title: "Mantle Estate v0.1: A New Way to Trade Synthetic Real Estate",
    category: "announcement",
    date: formatDate(new Date()),
    readingTime: "12 min",
    author: "Mantle Estate Team",
    excerpt: "Introducing the updated platform for trading synthetic real estate indices with expanded capabilities, improved UX, and new features for traders.",
    featured: true,
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    category: "announcement",
    date: formatDate(new Date()),
    readingTime: "5 min",
    author: "Mantle Estate Team",
    excerpt: "Our plans for the future development of Mantle Estate platform.",
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
