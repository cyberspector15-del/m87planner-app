import {
  ArrowRight,
  Clock,
  MapPin,
  Brain,
  Calendar,
  Target,
  GitBranch,
  ChartLine,
  Repeat,
  Bell,
  EnvelopeSimple,
  Moon,
  Lightning,
  AirplaneTilt,
  Robot,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import heroVideo from "@/assets/m87-hero-video.mp4";
const features = [
  {
    icon: Brain,
    title: "AI Auto-Scheduler",
    description: "Intelligent task placement based on priorities and preferences",
  },
  {
    icon: Robot,
    title: "AI Command Center",
    description: "Add tasks, events, and routines with natural language",
  },
  {
    icon: Clock,
    title: "Smart Time Blocks",
    description: "Automatic focus sessions and break scheduling",
  },
  {
    icon: Repeat,
    title: "Routine Builder",
    description: "Build habits and recurring tasks effortlessly",
  },
  {
    icon: Target,
    title: "Focus Mode",
    description: "Guided deep work sessions with progress tracking",
  },
  {
    icon: Lightning,
    title: "FLUX System",
    description: "Usage-based AI credits with transparent history",
  },
  {
    icon: GitBranch,
    title: "Consequences Simulator",
    description: "Model timelines and outcomes before committing to decisions",
  },
  {
    icon: ChartLine,
    title: "Analytics",
    description: "Track completion, focus time, streaks, and efficiency",
  },
  {
    icon: Calendar,
    title: "Timeline View",
    description: "A clean day view for events, tasks, and time blocks",
  },
  {
    icon: EnvelopeSimple,
    title: "M87 Mail",
    description: "In-app updates and messages with unread indicators",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Control alerts and reminders with granular settings",
  },
  {
    icon: MapPin,
    title: "Travel-Aware Scheduling",
    description: "Plan with commute time and location context in mind",
  },
  {
    icon: AirplaneTilt,
    title: "Smart Reschedule",
    description: "Rebalance unfinished tasks to protect your day",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Premium cosmic theme designed for long sessions",
  },
  {
    icon: EnvelopeSimple,
    title: "More Incoming",
    description: "More features on the way — watch your M87 Mail inbox.",
  },
];
const Home = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Section with M87 Image */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        
        {/* Gradient Overlays for better text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-transparent to-background" />

        {/* Content - positioned below the image text */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-[45vh]">
          {/* Hidden title for SEO/accessibility - visually the image provides the title */}
          <h1 className="sr-only">M87 Planner - AI-powered cosmic planner</h1>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in mt-8">
            <Button variant="cosmic-primary" size="xl" onClick={() => navigate("/auth")} className="gap-2 min-w-[200px]">
              Get Started
              <ArrowRight size={20} weight="thin" />
            </Button>
            <Button variant="cosmic-outline" size="xl" className="min-w-[200px]" onClick={scrollToFeatures}>
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
      <section ref={featuresRef} id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate opacity-0 translate-y-8 transition-all duration-700 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Harness the Power of AI
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Let M87 intelligently organize your schedule while you focus on what matters most.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => <div key={feature.title} className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 glass rounded-2xl p-6 hover:border-cosmic-silver/30 hover:scale-[1.02] group" style={{
            transitionDelay: `${index * 100}ms`
          }}>
                <div className="w-12 h-12 rounded-xl bg-cosmic-silver/10 flex items-center justify-center mb-4 group-hover:bg-cosmic-silver/20 transition-colors">
                  <feature.icon size={24} weight="thin" className="text-cosmic-silver" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center scroll-animate opacity-0 translate-y-8 transition-all duration-700 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(circle at center, hsl(175 40% 45% / 0.3) 0%, transparent 60%)'
          }} />
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Productivity?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join the cosmic revolution. Let AI handle your scheduling so you can focus on achieving your goals.
              </p>
              <Button variant="cosmic-primary" size="xl" onClick={() => navigate("/auth")} className="gap-2">
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
            <span className="font-display font-bold text-foreground">M87 PLANNER</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 M87 Planner. Powered by cosmic AI.</p>
        </div>
      </footer>
    </div>;
};
export default Home;
