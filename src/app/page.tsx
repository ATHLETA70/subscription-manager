import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { AuthListener } from "@/components/auth/auth-listener";

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 text-center relative overflow-hidden">
      <AuthListener />

      {/* Header with Login button */}
      <div className="absolute top-0 right-0 p-6 w-full flex justify-end z-50">
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-4 py-2"
        >
          Login
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl mx-auto mt-[-10vh]">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10" />

        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 backdrop-blur-sm shadow-sm">
          <CreditCard className="w-12 h-12 text-primary" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Subscription Manager
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage all your subscriptions in one place. Track expenses, renewal dates, and optimize your spending with our premium dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          <Link href="/signup" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-all border border-border/50">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
