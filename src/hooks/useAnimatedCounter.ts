import { useState, useEffect } from 'react';

export const useAnimatedCounter = (
  endValue: number, 
  duration: number = 1000,
  delay: number = 0
) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (endValue === 0) {
      setCurrentValue(0);
      return;
    }

    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const value = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setCurrentValue(value);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentValue(endValue);
        }
      };
      
      animate();
    }, delay);

    return () => clearTimeout(timer);
  }, [endValue, duration, delay]);

  return currentValue;
};