// import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        {/* Header or Nav could go here */}
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-700 before:opacity-10 before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-blue-900 after:via-blue-900 after:opacity-40 after:blur-2xl after:content-['']">
        <div className="flex flex-col items-center gap-6">
          <div className="p-4 bg-secondary/30 rounded-2xl border border-white/10 backdrop-blur-sm">
            <CreditCard className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Subscription Manager
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Manage all your subscriptions in one place. Track expenses, renewal dates, and optimize your spending with our premium dashboard.
          </p>
          <div className="flex gap-4 mt-4">
            <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left mt-24">
        {/* Features could go here */}
      </div>
    </main>
  );
}
