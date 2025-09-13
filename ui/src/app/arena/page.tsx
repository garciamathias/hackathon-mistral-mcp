"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Arena() {
  const numRows = 34;
  const numCols = 18;

  const [visbleGrid, setVisbleGrid] = useState<boolean>(true);

  // Configuration des tours
  const TOWER = {
    KING_RED: {
      id: 'king_red',
      name: 'King Red',
      image: '/images/towers/king_red.png',
      row: 2,
      col: 8,
      size: 6,
      offsetX: 1,
      offsetY: -2,
      team: 'red',
      type: 'king',
      active: true,
    },
    PRINCESS_RED_1: {
      id: 'princess_red',
      name: 'Princess Red',
      image: '/images/towers/princess_red.png',
      row: 6,
      col: 3,
      size: 4,
      offsetX: -0.7,
      offsetY: -2.3,
      team: 'red',
      type: 'princess',
      active: true,
    },
    PRINCESS_RED_2: {
      id: 'princess_red_2',
      name: 'Princess Red',
      image: '/images/towers/princess_red.png',
      row: 6,
      col: 14,
      size: 4,
      offsetX: 0,
      offsetY: -2.3,
      team: 'red',
      type: 'princess',
      active: true,
    },
    PRINCESS_BLUE_1: {
      id: 'princess_blue',
      name: 'Princess Blue',
      image: '/images/towers/princess_blue.png',
      row: 27,
      col: 3,
      size: 7.4,
      offsetX: -0.4,
      offsetY: -2,
      team: 'blue',
      type: 'princess',
      active: true,
    },
    PRINCESS_BLUE_2: {
      id: 'princess_blue_2',
      name: 'Princess Blue',
      image: '/images/towers/princess_blue.png',
      row: 27,
      col: 14,
      size: 7.4,
      offsetX: 0,
      offsetY: -2,
      team: 'blue',
      type: 'princess',
      active: true,
    },
    KING_BLUE: {
      id: 'king_blue',
      name: 'King Blue',
      image: '/images/towers/king_blue.png',
      row: 30,
      col: 8,
      size: 6.5,
      offsetX: 1,
      offsetY: -2,
      team: 'blue',
      type: 'king',
      active: true,
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
        <div className="absolute inset-0 bg-black/20 pl-[12%] pr-[16.3%] pt-[44.3%] pb-[30.4%]">
          <div className={`w-full h-full grid gap-0`} style={{
            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
            gridTemplateRows: `repeat(${numRows}, 1fr)`
          }}>
            {Array.from({ length: numRows * numCols }, (_, index) => {
              const row = Math.floor(index / numCols);
              const col = index % numCols;
              const isEven = (row + col) % 2 === 0;
              const towerPosition = Object.values(TOWER).find(pos => {
                return row === pos.row && col === pos.col;
              });
              
              // Afficher l'image seulement sur la case principale (coin supérieur gauche)
              const shouldShowTower = towerPosition && (
                row === towerPosition.row && col === towerPosition.col
              );
              
              const towerImage = shouldShowTower ? towerPosition.image : null;
              const tower = towerPosition;
              
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
                      alt={tower?.name}
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
