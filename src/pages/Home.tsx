import { ArrowRight, Sparkles, Clock, MapPin, Brain, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/m87-hero.png";

const features = [
  {
    icon: Brain,
    title: "AI Auto-Scheduler",
    description: "Intelligent task placement based on priorities and preferences",
  },
  {
    icon: Clock,
    title: "Smart Time Blocks",
    description: "Automatic focus sessions and break scheduling",
  },
  {
    icon: MapPin,
    title: "Travel-Aware",
    description: "Calculates commute time between locations",
  },
  {
    icon: Calendar,
    title: "Routine Builder",
    description: "Generate habits and recurring tasks effortlessly",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Section with M87 Image */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Gradient Overlays for better text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-transparent to-background" />

        {/* Content - positioned below the image text */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-[45vh]">
          {/* Hidden title for SEO/accessibility - visually the image provides the title */}
          <h1 className="sr-only">M87 Planner - AI-powered cosmic planner</h1>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in mt-16">
            <Button 
              variant="cosmic-primary" 
              size="xl"
              onClick={() => navigate("/dashboard")}
              className="gap-2 min-w-[200px]"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="cosmic-outline" 
              size="xl"
              className="min-w-[200px]"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-cosmic-silver/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-cosmic-silver/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Harness the Power of AI
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Let M87 intelligently organize your schedule while you focus on what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 hover:border-cosmic-silver/30 transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-cosmic-silver/10 flex items-center justify-center mb-4 group-hover:bg-cosmic-silver/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-cosmic-silver" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at center, hsl(175 40% 45% / 0.3) 0%, transparent 60%)',
              }}
            />
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Productivity?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join the cosmic revolution. Let AI handle your scheduling so you can focus on achieving your goals.
              </p>
              <Button 
                variant="cosmic-primary" 
                size="xl"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Planning Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cosmic-silver" />
            <span className="font-display font-bold text-foreground">M87 PLANNER</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 M87 Planner. Powered by cosmic AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
