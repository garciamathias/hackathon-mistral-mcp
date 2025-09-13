"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Arena() {
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const numRows = 34;
  const numCols = 18;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fond flou */}
      <img
        src="/images/backgrounds/arena_in_game.png"
        alt="Goal Background Blurred"
        className="absolute inset-0 w-full h-full object-cover blur-sm"
      />
      
      {/* Container avec ratio 9/16 */}
      <div className="relative w-[56.25vh] h-screen max-w-full max-h-screen z-10">
        <img
          src="/images/backgrounds/arena_in_game.png"
          alt="Arena In Game"
          className="w-full h-full object-cover"
        />

        {/* Damier interactif */}
        <div className="absolute inset-0 bg-black/20 pl-14 pr-19 pt-51 pb-35">
          <div className={`w-full h-full grid gap-0`} style={{
            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
            gridTemplateRows: `repeat(${numRows}, 1fr)`
          }}>
            {Array.from({ length: numRows * numCols }, (_, index) => {
              const row = Math.floor(index / numCols);
              const col = index % numCols;
              const isEven = (row + col) % 2 === 0;
              const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
              
              return (
                <div
                  key={index}
                  className={`w-full h-full cursor-pointer transition-all duration-200 ${
                    isEven 
                      ? 'bg-white/10 hover:bg-white/20' 
                      : 'bg-black/20 hover:bg-black/30'
                  } ${
                    isHovered ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
                  }`}
                  onMouseEnter={() => handleCellHover(row, col)}
                  onMouseLeave={handleCellLeave}
                />
              );
            })}
          </div>
        </div>
        
        {/* Bouton retour au menu principal */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <Button 
              variant="secondary" 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
            >
              ← Retour au Menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
