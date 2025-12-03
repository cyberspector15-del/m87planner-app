import { Sparkles, Clock, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import blackholeImage from "@/assets/m87-blackhole.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cosmic-silver" />
          <span className="font-display font-bold text-foreground tracking-wide">M87 Planner</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Elegant • Mysterious • Cosmic
        </div>
      </header>

      {/* Hero Section with Black Hole */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-16">
        {/* Black Hole Image */}
        <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center">
          <img 
            src={blackholeImage} 
            alt="M87 Black Hole" 
            className="w-full max-w-md opacity-80"
          />
          
          {/* Text Overlay on Black Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              M87 Planner
            </h1>
            <p className="text-muted-foreground max-w-md text-sm md:text-base">
              AI-powered cosmic planner that organizes your day with travel-aware scheduling and routines.
            </p>
          </div>
        </div>
      </section>

      {/* Today's Timeline Section */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold text-foreground">Today's Timeline</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2 border-border/40 hover:bg-cosmic-surface"
          >
            <Wand2 className="w-4 h-4" />
            Auto Plan
          </Button>
        </div>
        
        {/* Timeline Placeholder */}
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm">Generating...</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 py-4 border-t border-border/20">
        <p className="text-center text-sm text-muted-foreground">
          © 2025 M87 Planner • Cosmic focus, clean planning
        </p>
      </footer>
    </div>
  );
};

export default Home;
