import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Point {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ConstellationNetworkProps {
  isHovered: boolean;
}

export default function ConstellationNetwork({ isHovered }: ConstellationNetworkProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [walkerPosition, setWalkerPosition] = useState({ x: 50, y: 50 });
  const [currentTarget, setCurrentTarget] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize points
  useEffect(() => {
    const initialPoints: Point[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
    setPoints(initialPoints);
  }, []);

  // Animate points drifting
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prevPoints => 
        prevPoints.map(point => {
          let newX = point.x + point.vx;
          let newY = point.y + point.vy;
          let newVx = point.vx;
          let newVy = point.vy;

          // Bounce off edges
          if (newX < 10 || newX > 90) newVx = -newVx;
          if (newY < 10 || newY > 90) newVy = -newVy;

          // Add slight randomness
          newVx += (Math.random() - 0.5) * 0.05;
          newVy += (Math.random() - 0.5) * 0.05;

          // Limit velocity
          newVx = Math.max(-0.5, Math.min(0.5, newVx));
          newVy = Math.max(-0.5, Math.min(0.5, newVy));

          return {
            ...point,
            x: Math.max(10, Math.min(90, newX)),
            y: Math.max(10, Math.min(90, newY)),
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Animate walker
  useEffect(() => {
    if (points.length === 0) return;

    const interval = setInterval(() => {
      const targetPoint = points[currentTarget];
      if (!targetPoint) return;

      setWalkerPosition(prev => {
        const dx = targetPoint.x - prev.x;
        const dy = targetPoint.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 3) {
          setCurrentTarget((currentTarget + 1) % points.length);
          return prev;
        }

        return {
          x: prev.x + (dx / distance) * 1.5,
          y: prev.y + (dy / distance) * 1.5,
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [points, currentTarget]);

  // Calculate connections
  const getConnections = () => {
    const connections: { from: Point; to: Point; distance: number }[] = [];
    const threshold = isHovered ? 45 : 35;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < threshold) {
          connections.push({ from: points[i], to: points[j], distance });
        }
      }
    }
    return connections;
  };

  const connections = getConnections();

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Connection lines */}
        {connections.map((conn, index) => {
          const opacity = Math.max(0.1, 1 - conn.distance / 40) * (isHovered ? 1 : 0.6);
          return (
            <motion.line
              key={`${conn.from.id}-${conn.to.id}`}
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke={isHovered ? "#F59E0B" : "#D97706"}
              strokeWidth={isHovered ? 1.5 : 1}
              strokeOpacity={opacity}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Points */}
      {points.map((point) => (
        <motion.div
          key={point.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            backgroundColor: isHovered ? '#FBBF24' : '#F59E0B',
            boxShadow: isHovered 
              ? '0 0 10px rgba(251, 191, 36, 0.6)' 
              : '0 0 5px rgba(245, 158, 11, 0.4)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: isHovered ? [1, 1.3, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: point.id * 0.1,
          }}
        />
      ))}

      {/* Walker */}
      <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{
          left: `${walkerPosition.x}%`,
          top: `${walkerPosition.y}%`,
          backgroundColor: '#FCD34D',
          boxShadow: '0 0 15px rgba(252, 211, 77, 0.8)',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.12) 0%, transparent 70%)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
