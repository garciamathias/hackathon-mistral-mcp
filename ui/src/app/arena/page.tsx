"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Arena() {
  const numRows = 34;
  const numCols = 18;

  const [visbleGrid, setVisbleGrid] = useState<boolean>(true);

  // Positions des tours
  const towers = [
    // King red (2x2 cells)
    { row: 2, col: 8, type: 'king_red', size: 6, offsetX: 1, offsetY: -2 },
    
    // Red princess 1 (1x1 cell)
    { row: 6, col: 3, type: 'princess_red', size: 4, offsetX: -0.7, offsetY: -2.3 },

    // Red princess 2 (1x1 cell)
    { row: 6, col: 14, type: 'princess_red', size: 4, offsetX: 0, offsetY: -2.3 },
    
    // Blue princess 1 (1x1 cell)
    { row: 27, col: 3, type: 'princess_blue', size: 7.4, offsetX: -0.4, offsetY: -2 },
    
    // Blue princess 2 (1x1 cell)
    { row: 27, col: 14, type: 'princess_blue', size: 7.4, offsetX: 0, offsetY: -2 },
    
    // King blue (2x2 cells)
    { row: 30, col: 8, type: 'king_blue', size: 6.5, offsetX: 1, offsetY: -2 },
  ];

  const getTowerImage = (type: string) => {
    switch(type) {
      case 'king_red': return '/images/towers/king_red.png';
      case 'princess_red': return '/images/towers/princess_red.png';
      case 'princess_blue': return '/images/towers/princess_blue.png';
      case 'king_blue': return '/images/towers/king_blue.png';
      default: return null;
    }
  };

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
              const tower = towers.find(tower => {
                return row === tower.row && col === tower.col;
              });
              
              // Afficher l'image seulement sur la case principale (coin supérieur gauche)
              const shouldShowTower = tower && (
                row === tower.row && col === tower.col
              );
              
              const towerImage = shouldShowTower ? getTowerImage(tower.type) : null;
              
              return (
                <div
                  key={index}
                  className={`w-full h-full cursor-pointer transition-all duration-200 relative ${
                    visbleGrid 
                      ? (isEven 
                          ? 'bg-white/10 hover:bg-white/20 hover:ring-2 ring-yellow-400 ring-opacity-50'  
                          : 'bg-black/20 hover:bg-black/30 hover:ring-2 ring-yellow-400 ring-opacity-50')
                      : 'hover:ring-2 ring-yellow-400 ring-opacity-50'
                  }`}
                  onClick={() => {
                    console.log(`Cell ${row}, ${col}`);
                  }}
                >
                  {towerImage && (
                    <img
                      src={towerImage}
                      alt={tower?.type}
                      className="absolute inset-0 w-full h-full z-10 pointer-events-none object-contain"
                      style={{
                        transform: `scale(${tower?.size}) translate(${tower?.offsetX}px, ${tower?.offsetY}px)`
                      }}
                    />
                  )}
                </div>
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
          <Button 
            variant="secondary" 
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
            onClick={() => setVisbleGrid(!visbleGrid)}
        >
            Visible Grid
        </Button>
        </div>
      </div>
    </div>
  );
}
