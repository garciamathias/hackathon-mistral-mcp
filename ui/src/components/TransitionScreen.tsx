"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TransitionScreenProps {
  onTransitionComplete?: () => void;
}

export default function TransitionScreen({ onTransitionComplete }: TransitionScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fade in immédiatement
    setIsVisible(true);
    
    // Après 1.5 secondes, commencer le fade out
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);
    
    // Naviguer vers l'arène immédiatement après avoir commencé le fade out
    const navigateTimer = setTimeout(() => {
      router.push('/arena');
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    }, 1500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(navigateTimer);
    };
  }, [router, onTransitionComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec transition */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Image de transition */}
      <div 
        className={`relative transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img
          src="/images/backgrounds/waiting_page_template.png"
          alt="Loading..."
          className="w-full h-full object-cover"
          style={{
            width: '56.25vh',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        />
      </div>
    </div>
  );
}
