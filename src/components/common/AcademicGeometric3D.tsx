import React, { useEffect, useRef } from 'react';

/**
 * Lightweight, high-performance 3D academic geometric canvas.
 * Renders an elegant wireframe icosahedron with subtle glowing vertices
 * representing academic interconnectedness and research nodes.
 */
export const AcademicGeometric3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0.4;
    let angleY = 0.6;
    let mouseX = 0;
    let mouseY = 0;

    // Golden ratio for icosahedron vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = 75;

    // 12 vertices of icosahedron
    const rawVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    // Normalize and scale
    const vertices = rawVertices.map(v => {
      const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return [v[0] / len * scale, v[1] / len * scale, v[2] / len * scale];
    });

    // Edges connecting vertices with distance threshold
    const edges: [number, number][] = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dx = vertices[i][0] - vertices[j][0];
        const dy = vertices[i][1] - vertices[j][1];
        const dz = vertices[i][2] - vertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - scale * 1.05) < scale * 0.1) {
          edges.push([i, j]);
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Smooth rotation with mouse influence
      angleX += 0.005 + (mouseY * 0.01);
      angleY += 0.007 + (mouseX * 0.01);

      const cx = width / 2;
      const cy = height / 2;

      // Project vertices
      const projected = vertices.map(v => {
        // Rotate around Y
        let x1 = v[0] * Math.cos(angleY) + v[2] * Math.sin(angleY);
        let y1 = v[1];
        let z1 = -v[0] * Math.sin(angleY) + v[2] * Math.cos(angleY);

        // Rotate around X
        let x2 = x1;
        let y2 = y1 * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = y1 * Math.sin(angleX) + z1 * Math.cos(angleX);

        // Perspective projection
        const fov = 320;
        const pz = z2 + 280;
        const px = cx + (x2 * fov) / pz;
        const py = cy + (y2 * fov) / pz;
        const alpha = Math.max(0.15, Math.min(0.85, (z2 + scale) / (2 * scale)));

        return { x: px, y: py, z: z2, alpha };
      });

      // Draw edges
      edges.forEach(([i, j]) => {
        const v1 = projected[i];
        const v2 = projected[j];
        const avgAlpha = (v1.alpha + v2.alpha) / 2;

        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = `rgba(79, 70, 229, ${avgAlpha * 0.4})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Draw vertices as glowing nodes
      projected.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${v.alpha})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(165, 180, 252, ${v.alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};
