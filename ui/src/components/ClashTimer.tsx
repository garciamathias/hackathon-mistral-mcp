"use client";

import { useState, useEffect } from "react";
import { serverEngine } from "@/game/ServerSyncEngine";

export default function ClashTimer() {
  const [timeLeft, setTimeLeft] = useState(180); // 3:00 in seconds

  useEffect(() => {
    // Utiliser le temps du serveur au lieu d'un timer local
    const updateTimer = () => {
      const gameStats = serverEngine.getGameStats();
      const serverTime = gameStats.gameTime || 0;
      
      // Calculer le temps restant (180 secondes - temps écoulé)
      const remainingTime = Math.round(Math.max(0, 180 - serverTime));
      setTimeLeft(remainingTime);
    };

    // Mettre à jour immédiatement
    updateTimer();

    // Poller toutes les 100ms pour une mise à jour fluide
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      {/* Timer Container - Transparent black background with semi-transparent border */}
      <div className="relative bg-black/60 rounded-md px-4 py-1 border-2 border-black/80 text-center"
           style={{
             boxShadow: '0 2px 8px rgba(0,0,0,0.8)'
           }}>

        {/* "Time left:" text in yellow/gold - centered */}
        <div className="text-yellow-400 text-xs font-bold tracking-wide supercell-font"
             style={{
               textShadow: '1px 1px 2px rgba(0,0,0,1)'
             }}>
          Time left:
        </div>

        {/* Timer numbers in white - centered */}
        <div className="text-white text-2xl font-bold tracking-wider leading-tight supercell-font"
             style={{
               textShadow: '2px 2px 4px rgba(0,0,0,1)'
             }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Subtle glow effect when time is low */}
      {timeLeft <= 10 && (
        <div className="absolute inset-0 bg-red-500/15 blur-md animate-pulse rounded-md"></div>
      )}
    </div>
  );
}