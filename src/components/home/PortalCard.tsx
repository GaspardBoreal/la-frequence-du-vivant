import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface PortalCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  href: string;
  accentColor: string;
  glowColor: string;
  delay?: number;
}

export default function PortalCard({
  children,
  title,
  description,
  href,
  accentColor,
  glowColor,
  delay = 0
}: PortalCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Animated border glow */}
      <div 
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${glowColor}, ${accentColor})`,
          backgroundSize: '200% 100%',
          animation: isHovered ? 'border-glow-rotate 3s linear infinite' : 'none',
        }}
      />
      
      {/* Ring pulse effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={isHovered ? {
          boxShadow: [
            `0 0 0 0 ${glowColor}40`,
            `0 0 0 15px ${glowColor}00`,
          ]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Main card */}
      <motion.div
        className="relative h-full bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 overflow-hidden"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          boxShadow: isHovered 
            ? `0 25px 50px -12px ${glowColor}30, 0 0 30px ${glowColor}20`
            : '0 10px 40px -10px rgba(0,0,0,0.3)'
        }}
      >
        {/* Content area */}
        <div className="relative p-6 h-48 overflow-hidden">
          {children}
        </div>

        {/* Separator line */}
        <div className="relative h-[1px] mx-6">
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: accentColor }}
            animate={{ 
              scaleX: isHovered ? 1 : 0.3,
              opacity: isHovered ? 1 : 0.5 
            }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Text content */}
        <div className="p-6 pt-4 space-y-2">
          <h3 
            className="text-xl font-semibold tracking-wide"
            style={{ color: isHovered ? accentColor : 'white' }}
          >
            ✧ {title} ✧
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>

          {/* Hover indicator */}
          <motion.div
            className="flex items-center gap-2 pt-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs tracking-wider uppercase" style={{ color: accentColor }}>
              Entrer dans ce monde
            </span>
            <motion.span
              animate={{ x: isHovered ? [0, 5, 0] : 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ color: accentColor }}
            >
              →
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
