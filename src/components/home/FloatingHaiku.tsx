import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HAIKUS = [
  "« La rivière murmure\ndes mots que seuls les arbres\nsavent écouter »",
  "« Sous l'écorce ancienne\nmille vies invisibles\ntissent leur silence »",
  "« Le héron s'envole\nemportant dans son reflet\nun morceau de ciel »",
  "« Feuilles de chêne\ntombant sur l'eau sombre\nlettres de la forêt »",
  "« Entre deux rives\nla Dordogne chante\nce que nous oublions »",
];

interface FloatingHaikuProps {
  isHovered: boolean;
}

export default function FloatingHaiku({ isHovered }: FloatingHaikuProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Rotate haikus
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % HAIKUS.length);
        setDisplayedText('');
        setIsTyping(true);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    
    const currentHaiku = HAIKUS[currentIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= currentHaiku.length) {
        setDisplayedText(currentHaiku.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [currentIndex, isTyping]);

  // Generate falling leaves
  const leaves = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    startX: 10 + Math.random() * 80,
    delay: i * 1.5,
    duration: 8 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
      {/* Falling leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute text-lg opacity-40"
          style={{ left: `${leaf.startX}%` }}
          animate={{
            y: ['-10%', '110%'],
            x: [0, 20, -10, 15, 0],
            rotate: [0, 45, -30, 60, 180],
            opacity: [0, 0.5, 0.5, 0.5, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {leaf.id % 2 === 0 ? '🍂' : '🍃'}
        </motion.div>
      ))}

      {/* Haiku text */}
      <div className="relative z-10 text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-sm leading-relaxed"
            style={{
              color: isHovered ? '#F9A8D4' : '#E879F9',
              textShadow: isHovered ? '0 0 20px rgba(249, 168, 212, 0.5)' : 'none',
            }}
          >
            {displayedText.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < displayedText.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block ml-1"
            >
              |
            </motion.span>
          </motion.div>
        </AnimatePresence>

        {/* Decorative dashes */}
        <motion.div
          className="flex justify-center gap-1 mt-4"
          animate={{ opacity: isHovered ? 1 : 0.5 }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              className="w-3 h-[2px] rounded-full"
              style={{ backgroundColor: isHovered ? '#F9A8D4' : '#E879F9' }}
              animate={{
                scaleX: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Gradient glow on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(232, 121, 249, 0.15) 0%, transparent 70%)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
