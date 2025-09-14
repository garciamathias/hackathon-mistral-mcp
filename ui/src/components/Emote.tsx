import React, { useEffect, useRef } from 'react';

interface EmoteProps {
  type: 'haha' | 'cry' | 'mumumu';
  position: { x: number; y: number };
  onComplete?: () => void;
}

const Emote: React.FC<EmoteProps> = ({ type, position, onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Failed to play emote sound:', e));
    }

    // Auto remove after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Map emote type to image file
  const getEmoteImage = () => {
    switch (type) {
      case 'haha':
        return '/haha.avif';
      case 'cry':
        return '/cry.png';
      case 'mumumu':
        return '/mumumu.png';
      default:
        return '/haha.avif';
    }
  };

  return (
    <>
      <div
        className="emote-container"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '24px',
          height: '24px',
          zIndex: 1000,
          animation: 'emoteAnimation 3s ease-out forwards',
        }}
      >
        <img
          src={getEmoteImage()}
          alt={type}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      <audio ref={audioRef} src={`/${type}.mp3`} />

      <style jsx>{`
        @keyframes emoteAnimation {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(10px);
          }
          20% {
            opacity: 1;
            transform: scale(1.2) translateY(-5px);
          }
          30% {
            transform: scale(1) translateY(0);
          }
          80% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
          }
        }
      `}</style>
    </>
  );
};

export default Emote;