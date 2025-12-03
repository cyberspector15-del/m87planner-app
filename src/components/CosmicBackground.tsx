import m87Image from "@/assets/m87-blackhole.png";

const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-cosmic-gradient" />
      
      {/* Black hole image with low opacity */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[150vmax] h-[150vmax] animate-cosmic-rotate"
          style={{
            backgroundImage: `url(${m87Image})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.07,
          }}
        />
      </div>
      
      {/* Radial gradient overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, hsl(0 0% 0% / 0.6) 60%, hsl(0 0% 0% / 0.9) 100%)',
        }}
      />
      
      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Teal accent line (like in the reference image) */}
      <div 
        className="absolute left-0 right-0 h-px"
        style={{
          top: '45%',
          background: 'linear-gradient(90deg, transparent 0%, hsl(175 40% 45% / 0.4) 30%, hsl(175 40% 45% / 0.6) 50%, hsl(175 40% 45% / 0.4) 70%, transparent 100%)',
          boxShadow: '0 0 30px hsl(175 40% 45% / 0.5)',
        }}
      />
    </div>
  );
};

export default CosmicBackground;
