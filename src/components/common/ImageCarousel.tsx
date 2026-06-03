"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function ImageCarousel({ images, interval = 5000 }: { images: string[], interval?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.5 } }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          alt="Slideshow"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
}
