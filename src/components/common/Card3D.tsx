import React, { useRef, useState, useEffect } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (default 6 for subtle elegance)
  perspective?: number; // perspective in px (default 1000)
  glowColor?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  maxTilt = 6,
  perspective = 1000,
  glowColor = 'rgba(99, 102, 241, 0.08)',
  onClick,
  interactive = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = x / rect.width;
    const yPct = y / rect.height;

    // Calculate tilt
    const tiltX = (0.5 - yPct) * (maxTilt * 2);
    const tiltY = (xPct - 0.5) * (maxTilt * 2);

    setTilt({ x: tiltX, y: tiltY });
    setGlarePos({ x: xPct * 100, y: yPct * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const transformStyle = prefersReducedMotion || !interactive
    ? undefined
    : `perspective(${perspective}px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(4px)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        transform: transformStyle,
        transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease' : 'transform 0.08s ease-out, box-shadow 0.2s ease',
        transformStyle: 'preserve-3d'
      }}
      className={`relative w-full min-w-0 max-w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(30,41,59,0.12),0_4px_12px_-2px_rgba(30,41,59,0.06)] active:scale-[0.99] touch-manipulation transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Specular ambient light sheen */}
      {!prefersReducedMotion && interactive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 60%)`
          }}
        />
      )}
      <div className="relative z-10 w-full h-full min-w-0">
        {children}
      </div>
    </div>
  );
};
