import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBlogPostBySlug } from "@/data/blogPosts";
import { getBlogContent } from "@/data/blogContent";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Post not found</h1>
            <Link to="/blog">
              <Button variant="outline">Back to Blog</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back button */}
          <Link to="/blog">
            <Button
              variant="ghost"
              className="mb-8 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article */}
          <article>
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

              {/* Meta information */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Date:</span> {post.date}
                </div>
                <div>
                  <span className="font-medium">Author:</span> {post.author}
                </div>
                <div>
                  <span className="font-medium">Reading Time:</span> {post.readingTime}
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {getBlogContent(post.slug) || (
                <p className="text-muted-foreground">Content coming soon.</p>
              )}
            </div>
          </article>
        </main>
    </div>
  );
}
