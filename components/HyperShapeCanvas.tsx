import React, { useEffect, useRef } from 'react';
import { Shape4D, RotationSpeeds, Point4D } from '../types';

interface Props {
  shape: Shape4D;
  speeds: RotationSpeeds;
  isPlaying: boolean;
  scale: number;
}

const HyperShapeCanvas: React.FC<Props> = ({ shape, speeds, isPlaying, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Mutable state for animation loop to avoid react render cycle overhead
  const anglesRef = useRef({
    xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0
  });

  // Store the current positions of vertices for morphing animation
  // Initialize with a copy of the first shape's vertices
  const currentModelVertices = useRef<Point4D[]>(shape.vertices.map(v => ({ ...v })));

  // Projection params
  const distance4D = 2; // Camera distance in 4D (w-axis)
  const distance3D = 3; // Camera distance in 3D (z-axis)

  // 4D Rotation Matrix Helpers
  const rotate = (p: Point4D, angles: typeof anglesRef.current): Point4D => {
    let { x, y, z, w } = p;
    let tempX, tempY, tempZ, tempW;

    // XY Rotation
    if (angles.xy) {
      tempX = x * Math.cos(angles.xy) - y * Math.sin(angles.xy);
      tempY = x * Math.sin(angles.xy) + y * Math.cos(angles.xy);
      x = tempX; y = tempY;
    }
    // XZ Rotation
    if (angles.xz) {
      tempX = x * Math.cos(angles.xz) - z * Math.sin(angles.xz);
      tempZ = x * Math.sin(angles.xz) + z * Math.cos(angles.xz);
      x = tempX; z = tempZ;
    }
    // XW Rotation
    if (angles.xw) {
      tempX = x * Math.cos(angles.xw) - w * Math.sin(angles.xw);
      tempW = x * Math.sin(angles.xw) + w * Math.cos(angles.xw);
      x = tempX; w = tempW;
    }
    // YZ Rotation
    if (angles.yz) {
      tempY = y * Math.cos(angles.yz) - z * Math.sin(angles.yz);
      tempZ = y * Math.sin(angles.yz) + z * Math.cos(angles.yz);
      y = tempY; z = tempZ;
    }
    // YW Rotation
    if (angles.yw) {
      tempY = y * Math.cos(angles.yw) - w * Math.sin(angles.yw);
      tempW = y * Math.sin(angles.yw) + w * Math.cos(angles.yw);
      y = tempY; w = tempW;
    }
    // ZW Rotation
    if (angles.zw) {
      tempZ = z * Math.cos(angles.zw) - w * Math.sin(angles.zw);
      tempW = z * Math.sin(angles.zw) + w * Math.cos(angles.zw);
      z = tempZ; w = tempW;
    }

    return { x, y, z, w };
  };

  const project = (p: Point4D, width: number, height: number): { x: number, y: number, scale: number, wVal: number } | null => {
    // 1. Project 4D to 3D
    // Perspective projection factor for 4D->3D
    const wDist = distance4D - p.w;
    if (wDist <= 0) return null; // Behind camera
    
    const factor4 = 1 / wDist;
    const x3 = p.x * factor4;
    const y3 = p.y * factor4;
    const z3 = p.z * factor4;

    // 2. Project 3D to 2D
    const zDist = distance3D - z3;
    if (zDist <= 0) return null;

    const factor3 = 1 / zDist;
    // Scale up for canvas
    const x2 = x3 * factor3 * width * 0.4 * scale; 
    const y2 = y3 * factor3 * width * 0.4 * scale;

    return {
      x: x2 + width / 2,
      y: y2 + height / 2,
      scale: factor4, // Use 4D depth for point size
      wVal: p.w // Pass original W for coloring
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Update sizes if needed
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // --- 1. Morph Vertices ---
      // We interpolate `currentModelVertices` towards `shape.vertices`
      const targetVertices = shape.vertices;
      const currentVertices = currentModelVertices.current;
      const ease = 0.08; // Morph speed

      // Ensure we have enough vertices in our current model
      while (currentVertices.length < targetVertices.length) {
        // Spawn new vertices from center (0,0,0,0)
        currentVertices.push({ x: 0, y: 0, z: 0, w: 0 });
      }

      // Interpolate each vertex
      for (let i = 0; i < currentVertices.length; i++) {
        // If index exists in target, move towards it.
        // If index is outside target (old shape had more vertices), move to 0 (collapse).
        const target = i < targetVertices.length 
          ? targetVertices[i] 
          : { x: 0, y: 0, z: 0, w: 0 };
        
        const v = currentVertices[i];
        
        // Simple lerp
        v.x += (target.x - v.x) * ease;
        v.y += (target.y - v.y) * ease;
        v.z += (target.z - v.z) * ease;
        v.w += (target.w - v.w) * ease;
      }

      // --- 2. Update Angles ---
      if (isPlaying) {
        anglesRef.current.xy += speeds.xy;
        anglesRef.current.xz += speeds.xz;
        anglesRef.current.xw += speeds.xw;
        anglesRef.current.yz += speeds.yz;
        anglesRef.current.yw += speeds.yw;
        anglesRef.current.zw += speeds.zw;
      }

      // --- 3. Render ---
      ctx.clearRect(0, 0, width, height);
      
      // Calculate projected vertices from the MOVING (morphing) model vertices
      const projectedVertices = currentVertices.map(v => {
        const rotated = rotate(v, anglesRef.current);
        return project(rotated, width, height);
      });

      // Draw Edges
      // We use the NEW shape's edge definitions, but they connect the MORPHING vertices.
      ctx.lineWidth = 1.5;
      shape.edges.forEach(edge => {
        // Only draw edges if both indices are valid in our current vertex list
        // (They should be, because we grew the list)
        const p1 = projectedVertices[edge.source];
        const p2 = projectedVertices[edge.target];

        if (p1 && p2) {
          const depthColor = (w: number) => {
            // Map -1..1 to cyan..purple
            const intensity = (w + 1.5) / 3; 
            const r = Math.floor(255 * intensity);
            const b = Math.floor(255 * (1 - intensity));
            return `rgba(${r}, 200, ${b}, 0.6)`;
          };

          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, depthColor(p1.wVal));
          grad.addColorStop(1, depthColor(p2.wVal));
          
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Draw Vertices
      // We draw ALL vertices in the buffer. Extra ones collapsing to zero will appear as points merging to center.
      projectedVertices.forEach((p, idx) => {
        if (p) {
          // Fade out points that aren't part of the target shape
          const isTarget = idx < targetVertices.length;
          
          // If it's an extra vertex (ghost) and it has collapsed to near-zero, DO NOT RENDER IT.
          if (!isTarget) {
             const v = currentVertices[idx];
             // Check if it's effectively at the center (collapsed)
             const distSq = v.x*v.x + v.y*v.y + v.z*v.z + v.w*v.w;
             if (distSq < 0.001) return;
          }

          // Radius: 
          const radius = Math.max(1, 3 * p.scale); 
          
          ctx.fillStyle = isTarget ? '#fff' : 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [shape, speeds, isPlaying, scale]); // Dependencies

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
    />
  );
};

export default HyperShapeCanvas;