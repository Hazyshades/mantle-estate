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

const FIXED_BLOG_DATE = "1/15/2026";

export const blogPosts: BlogPost[] = [
  {
    slug: "compliance-declaration",
    title: "Compliance Declaration",
    category: "announcement",
    date: FIXED_BLOG_DATE,
    readingTime: "3 min",
    author: "Mantle Estate Team",
    excerpt: "A template disclosure for regulated assets and compliance considerations for the Mantle Estate project.",
    featured: true,
  },
  {
    slug: "mantle-estate-v0.1",
    title: "Mantle Estate v0.1: A New Way to Trade Synthetic Real Estate",
    category: "announcement",
    date: FIXED_BLOG_DATE,
    readingTime: "12 min",
    author: "Mantle Estate Team",
    excerpt: "Introducing the updated platform for trading synthetic real estate indices with expanded capabilities, improved UX, and new features for traders.",
    featured: true,
  },
  {
    slug: "one-pager-pitch",
    title: "One-pager Pitch",
    category: "announcement",
    date: FIXED_BLOG_DATE,
    readingTime: "4 min",
    author: "Mantle Estate Team",
    excerpt: "A concise overview of the problem, solution, business model, and roadmap behind Mantle Estate.",
    featured: true,
  },
  {
    slug: "how-to-work-with-mantle-estate",
    title: "How to work with Mantle Estate",
    category: "guide",
    date: FIXED_BLOG_DATE,
    readingTime: "2 min",
    author: "Mantle Estate Team",
    excerpt: "Step-by-step instructions for connecting your wallet, minting tUSDC, and depositing to start trading.",
    featured: true,
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    category: "announcement",
    date: FIXED_BLOG_DATE,
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
