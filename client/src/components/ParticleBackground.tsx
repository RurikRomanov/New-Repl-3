import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    // Initialize particles
    const activeMiners = 1; // Start with 1 particle for the current miner
    particles.current = Array.from({ length: activeMiners }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.15 + 0.05 // Reduced opacity
    }));

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let particleIntensity = 1;
    let targetIntensity = 1;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Smooth transition for particle intensity
      particleIntensity += (targetIntensity - particleIntensity) * 0.1;

      particles.current.forEach((particle) => {
        particle.x += particle.speedX * particleIntensity;
        particle.y += particle.speedY * particleIntensity;

        // Wrap around edges
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;

        // Dynamic particle size and opacity based on intensity
        const pulseSize = particle.size * (1 + Math.sin(Date.now() * 0.003) * 0.2);
        const dynamicOpacity = particle.opacity * (0.5 + particleIntensity * 0.5);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        
        // Gradient for particles
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulseSize
        );
        gradient.addColorStop(0, `rgba(64, 156, 255, ${dynamicOpacity})`);
        gradient.addColorStop(1, 'rgba(64, 156, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Update particles based on active miners count
    window.addEventListener('miners-count-changed', ((e: CustomEvent) => {
      const activeMiners = e.detail.count;
      const currentCount = particles.current.length;
      
      if (activeMiners > currentCount) {
        // Add new particles
        for (let i = 0; i < activeMiners - currentCount; i++) {
          particles.current.push({
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.15 + 0.05
          });
        }
      } else if (activeMiners < currentCount) {
        // Remove excess particles
        particles.current = particles.current.slice(0, activeMiners);
      }
    }) as EventListener);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Event listener for mining state changes
    const handleMiningState = (e: CustomEvent) => {
      targetIntensity = e.detail.mining ? 2.5 : 1;
    };

    window.addEventListener('mining-state-changed', handleMiningState as EventListener);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('mining-state-changed', handleMiningState as EventListener);
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
