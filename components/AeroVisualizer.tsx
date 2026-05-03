import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { CarParameters } from '../types';

interface AeroVisualizerProps {
  params: CarParameters;
  width?: number;
  height?: number;
}

class FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  isSmoke: boolean;
  r: number;
  g: number;
  b: number;

  constructor(x: number, y: number, vx: number, vy: number, isSmoke: boolean = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.maxLife = isSmoke ? 150 + Math.random() * 100 : 80 + Math.random() * 40;
    this.life = this.maxLife;
    this.size = isSmoke ? 3 + Math.random() * 5 : 1.5;
    this.isSmoke = isSmoke;
    // Default smoke/air color (white/grey)
    this.r = 200;
    this.g = 220;
    this.b = 230;
  }

  update(vectorField: (x: number, y: number) => { vx: number, vy: number, pressure: number }) {
    const field = vectorField(this.x, this.y);
    
    // Smooth velocity interpolation
    this.vx += (field.vx - this.vx) * 0.15;
    this.vy += (field.vy - this.vy) * 0.15;
    
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    
    if (this.isSmoke) {
        this.size += 0.05; // expand
    }

    // Dynamic Pressure Coloring
    // Base color: 200, 220, 230
    // High pressure (field.pressure > 0) -> Target: 255, 30, 30 (Red)
    // Low pressure (field.pressure < 0) -> Target: 30, 80, 255 (Blue)
    
    const p = Math.max(-1, Math.min(1, field.pressure)); // clamp -1 to 1
    
    let targetR = 200, targetG = 220, targetB = 230;

    if (p > 0) {
        // Shift to red
        targetR = 200 + p * 55;
        targetG = 220 - p * 190;
        targetB = 230 - p * 200;
    } else if (p < 0) {
        // Shift to blue
        const absP = Math.abs(p);
        targetR = 200 - absP * 170;
        targetG = 220 - absP * 140;
        targetB = 230 + absP * 25;
    }

    // Smooth color transition
    this.r += (targetR - this.r) * 0.2;
    this.g += (targetG - this.g) * 0.2;
    this.b += (targetB - this.b) * 0.2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const opacity = (this.life / this.maxLife) * (this.isSmoke ? 0.8 : 0.4);
    ctx.fillStyle = `rgba(${Math.floor(this.r)}, ${Math.floor(this.g)}, ${Math.floor(this.b)}, ${opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const AeroVisualizer: React.FC<AeroVisualizerProps> = ({ params, width = 800, height = 450 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Holographic 3D Tilt State
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isInjectingSmoke, setIsInjectingSmoke] = useState(false);
  const smokeInjectorPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/f1_side_profile.png'; 
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 3D Tilt Math
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 5; 
    const rotateX = -((y - centerY) / centerY) * 5;
    
    setTilt({ rotateX, rotateY });
    setIsHovering(true);

    if (isInjectingSmoke && canvasRef.current) {
       const scaleX = width / rect.width;
       const scaleY = height / rect.height;
       smokeInjectorPos.current = { x: x * scaleX, y: y * scaleY };
    }
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovering(false);
    setIsInjectingSmoke(false);
    smokeInjectorPos.current = null;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
      setIsInjectingSmoke(true);
      handleMouseMove(e); 
  };
  
  const handleMouseUp = () => {
      setIsInjectingSmoke(false);
      smokeInjectorPos.current = null;
  };

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: FluidParticle[] = [];
    let time = 0;

    const downforceNorm = (params.aeroDownforce - 20) / 80; 
    const dragNorm = (params.aeroDrag - 20) / 80; 
    const fwAngleNorm = params.frontWingFlapAngle / 60;

    const render = () => {
      // Clear with motion blur trail
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5, 10, 21, 0.25)'; 
      ctx.fillRect(0, 0, width, height);

      // Bounds
      const imgWidth = imgRef.current!.width;
      const imgHeight = imgRef.current!.height;
      const scale = (width * 0.9) / imgWidth; 
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const imgX = width * 0.05;
      const imgY = (height - scaledHeight) / 2;

      // Car Geometry for Vector Field
      const noseX = imgX + scaledWidth * 0.1;
      const cockpitX = imgX + scaledWidth * 0.45;
      const rearWingX = imgX + scaledWidth * 0.9;
      const groundY = imgY + scaledHeight * 0.62; 
      const haloY = imgY + scaledHeight * 0.45; 

      // Draw Base Car Image
      ctx.clearRect(imgX, imgY, scaledWidth, scaledHeight);
      ctx.fillStyle = '#050a15';
      ctx.fillRect(imgX, imgY, scaledWidth, scaledHeight);
      ctx.drawImage(imgRef.current!, imgX, imgY, scaledWidth, scaledHeight);

      ctx.globalCompositeOperation = 'screen';

      // Vector Flow Field Function with Pressure Mapping
      const getVectorAt = (px: number, py: number) => {
          let vx = 7 + (1 - dragNorm) * 5; // Base wind speed
          let vy = 0;
          let pressure = 0; // -1 (max suction) to 1 (max drag/stagnation)

          if (px > noseX && px < rearWingX && py > haloY - 20 && py < groundY) {
              const carCenterY = (haloY + groundY) / 2;
              vy = (py < carCenterY) ? -10 : 5; 
              pressure = 0.5; // Moderate stagnation on chassis
          } 
          // Overbody Deflection (Halo / Engine Cover)
          else if (px > noseX && px < rearWingX && py <= haloY - 20 && py > haloY - 100) {
              const proximity = 1 - (haloY - 20 - py) / 80;
              vy = -8 * proximity; 
              
              // Front Wing Stagnation Zone (Red)
              if (px < cockpitX) {
                  vy -= fwAngleNorm * 15 * proximity;
                  pressure = 1.0 * fwAngleNorm * proximity; // High pressure
              }
              // Rear Wing Stagnation Zone (Red)
              if (px > cockpitX && px < rearWingX) {
                  const rwProximity = 1 - (rearWingX - px) / 100;
                  pressure = 1.0 * downforceNorm * rwProximity * proximity;
                  vy -= 5 * downforceNorm * proximity;
              }
          }
          // Underfloor Suction / Ground Effect (Blue)
          else if (px > noseX && px < rearWingX && py >= groundY && py < groundY + 30) {
              vx += 6 * downforceNorm; 
              vy = -2 * downforceNorm; 
              pressure = -1.0 * downforceNorm; // Max suction
          }
          // Wake Turbulence (Dirty Air)
          else if (px >= rearWingX) {
              const wakeDist = (px - rearWingX) / 200;
              const turbulence = dragNorm * Math.sin(time * 0.1 + py * 0.05) * 8 * (1 - Math.min(1, wakeDist));
              
              if (py < groundY - 20) {
                  vy = -3 * downforceNorm + turbulence; 
                  vx -= 6 * dragNorm; 
                  pressure = 0.2 * dragNorm; // Mild pressure from dirty air
              } else if (py >= groundY - 20 && py < groundY + 20) {
                  vy = -5 * downforceNorm + turbulence; 
                  pressure = -0.3 * downforceNorm; // Lingering diffuser suction
              }
          }

          return { vx, vy, pressure };
      };

      // Spawn Ambient Wind Particles
      for (let i = 0; i < 4; i++) {
          const startY = height * 0.2 + Math.random() * (height * 0.7);
          particles.push(new FluidParticle(0, startY, 5, 0));
      }

      // Spawn Interactive Smoke Injection
      if (smokeInjectorPos.current) {
          for (let i = 0; i < 5; i++) {
              particles.push(new FluidParticle(
                  smokeInjectorPos.current.x + (Math.random() - 0.5) * 10,
                  smokeInjectorPos.current.y + (Math.random() - 0.5) * 10,
                  0, 0,
                  true // isSmoke
              ));
          }
      }

      // Update and Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.update(getVectorAt);
          p.draw(ctx);
          
          if (p.life <= 0 || p.x > width || p.y < 0 || p.y > height) {
              particles.splice(i, 1);
          }
      }

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [params, width, height, imageLoaded, isInjectingSmoke]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full perspective-[1000px] cursor-crosshair group"
    >
        <div 
            className="rounded-xl overflow-hidden border border-slate-700 bg-[#050a15] shadow-2xl relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${isHovering ? 1.02 : 1})`,
                boxShadow: isHovering ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-blue-500/50 font-mono text-sm animate-pulse">
              INITIALIZING VECTOR FIELD...
            </div>
          )}
          
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded px-3 py-1 text-xs text-slate-300 font-mono z-10 shadow-lg pointer-events-none">
            DYNAMIC PRESSURE WIND TUNNEL <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          </div>
          
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded px-3 py-2 text-[10px] text-slate-400 font-mono z-10 flex flex-col gap-1 shadow-lg pointer-events-none">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#c8dce6] shadow-[0_0_8px_rgba(200,220,230,0.8)]"></span> FREE AIR (1 ATM)
             </div>
             <div className="flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> HIGH PRESSURE (STAGNATION)
             </div>
             <div className="flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> LOW PRESSURE (SUCTION)
             </div>
          </div>

          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center ${isHovering && !isInjectingSmoke ? 'opacity-100' : 'opacity-0'}`}>
              <div className="text-white/30 font-mono text-sm tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                  DRAG TO INJECT PRESSURE-MAPPED SMOKE
              </div>
          </div>
          
          <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            className={`w-full max-w-[800px] h-auto block transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
    </div>
  );
};
