import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { getAllBlogPosts } from "@/data/blogPosts";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const posts = getAllBlogPosts();
  const featuredPost = posts.find((post) => post.featured);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts.filter((post) => !post.featured);
    }

    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        !post.featured &&
        (post.title.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground">
              News, updates, and insights from the Mantle Estate team.
            </p>
          </div>

          {/* Search */}
          <div className="mb-12">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Featured Article */}
          {featuredPost && (
            <div className="mb-12">
              <Link
                to={`/blog/${featuredPost.slug}`}
                className="block group"
              >
                <div className="border rounded-lg p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <span className="inline-block text-xs font-medium text-muted-foreground uppercase mb-2">
                        {featuredPost.category}
                      </span>
                      <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-muted-foreground mb-3">{featuredPost.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{featuredPost.date}</span>
                        <span>{featuredPost.readingTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-1">
            {filteredPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
              </p>
            ) : (
              filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="block group"
                >
                  <div className="border-b py-4 hover:bg-accent/50 transition-colors px-2 -mx-2 rounded">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors truncate">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.date}</span>
                          <span>{post.readingTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
    </div>
  );
}

