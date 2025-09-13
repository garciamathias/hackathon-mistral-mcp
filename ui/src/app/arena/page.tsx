"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useGameEngine } from "@/game/useGameEngine";

export default function Arena() {
  const numRows = 34;
  const numCols = 18;

  const [visbleGrid, setVisbleGrid] = useState<boolean>(true);
  const [highlightFlaggedCells, setHighlightFlaggedCells] = useState<boolean>(false);
  const [spawnMode, setSpawnMode] = useState<{active: boolean, team: 'red' | 'blue' | null}>({
    active: false,
    team: null
  });
   
  // Fonction pour obtenir toutes les cellules marquées des tours actives
  const getActiveTowersFlaggedCells = () => {
    const flaggedCells = new Set<string>();
    
    Object.values(TOWER).forEach(tower => {
      if (tower.active && tower.flagged_cells) {
        tower.flagged_cells.forEach(([row, col]) => {
          flaggedCells.add(`${row}-${col}`);
        });
      }
    });
    
    return flaggedCells;
  };

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
      flagged_cells: [
        [1, 7],
        [1, 8],
        [1, 9],
        [1, 10],
        [2, 10],
        [2, 9],
        [2, 8],
        [2, 7],
        [3, 7],
        [3, 8],
        [3, 9],
        [3, 10],
        [4, 10],
        [4, 9],
        [4, 8],
        [4, 7],
      ],
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
      flagged_cells: [
        [5, 2],
        [5, 3],
        [5, 4],
        [6, 4],
        [7, 4],
        [7, 3],
        [7, 2],
        [6, 2],
        [6, 3],
      ],
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
      flagged_cells: [
        [5, 13],
        [5, 14],
        [5, 15],
        [6, 15],
        [6, 14],
        [6, 13],
        [7, 13],
        [7, 14],
        [7, 15],
      ],
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
      flagged_cells: [
        [26, 2],
        [26, 3],
        [26, 4],
        [27, 4],
        [27, 3],
        [27, 2],
        [28, 2],
        [28, 3],
        [28, 4],
      ],
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
      flagged_cells: [
        [26, 13],
        [26, 14],
        [26, 15],
        [27, 15],
        [27, 14],
        [27, 13],
        [28, 13],
        [28, 14],
        [28, 15],
      ],
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
      flagged_cells: [
        [29, 7],
        [30, 7],
        [31, 7],
        [32, 7],
        [32, 8],
        [31, 8],
        [30, 8],
        [29, 8],
        [29, 9],
        [29, 10],
        [30, 10],
        [30, 9],
        [31, 9],
        [31, 10],
        [32, 10],
        [32, 9],
      ],
      active: true,
    }
  };

  // Convertir TOWER en format compatible avec le moteur de jeu
  const towersForGame = Object.values(TOWER);
  
  // Obtenir les flagged cells pour le moteur de jeu
  const flaggedCells = getActiveTowersFlaggedCells();
  
  // Hook du moteur de jeu
  const { 
    giants, 
    gameStats, 
    spawnGiantAt,
    startGame, 
    pauseGame, 
    resumeGame, 
    stopGame,
    isGameRunning,
    isGamePaused 
  } = useGameEngine(towersForGame, flaggedCells);

  // Fonctions pour le mode spawn
  const activateSpawnMode = (team: 'red' | 'blue') => {
    setSpawnMode({ active: true, team });
  };

  const deactivateSpawnMode = () => {
    setSpawnMode({ active: false, team: null });
  };

  const handleCellClick = (row: number, col: number) => {
    if (spawnMode.active && spawnMode.team && isGameRunning) {
      spawnGiantAt(spawnMode.team, row, col);
      deactivateSpawnMode();
    } else {
      console.log(`Cell ${row}, ${col}`);
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
              
              // Vérifier si cette cellule est marquée par une tour active
              const flaggedCells = getActiveTowersFlaggedCells();
              const isFlagged = flaggedCells.has(`${row}-${col}`);
              
              return (
                <div
                  key={index}
                  className={`w-full h-full transition-all duration-200 relative ${
                    spawnMode.active 
                      ? `cursor-crosshair ${
                          spawnMode.team === 'red' 
                            ? 'hover:bg-red-400/50 hover:ring-2 ring-red-400' 
                            : 'hover:bg-blue-400/50 hover:ring-2 ring-blue-400'
                        }`
                      : 'cursor-pointer'
                  } ${
                    highlightFlaggedCells && isFlagged
                      ? 'bg-red-500/70 hover:bg-red-400/80 hover:ring-2 ring-red-300'
                      : visbleGrid 
                        ? (isEven 
                            ? 'bg-white/10 hover:bg-white/20 hover:ring-2 ring-yellow-400 ring-opacity-50'  
                            : 'bg-black/20 hover:bg-black/30 hover:ring-2 ring-yellow-400 ring-opacity-50')
                        : 'hover:ring-2 ring-yellow-400 ring-opacity-50'
                  }`}
                  onClick={() => handleCellClick(row, col)}
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
                  
                  {/* Rendu des Giants sur cette cellule */}
                  {giants
                    .filter(giant => 
                      Math.floor(giant.position.row) === row && 
                      Math.floor(giant.position.col) === col
                    )
                    .map(giant => {
                      // Choisir le GIF selon l'état du Giant
                      let gifPath;
                      if (giant.isInCombat) {
                        // Mode combat
                        const team = giant.team === 'red' ? 'opponent' : 'player';
                        gifPath = `/images/troops/giant/Giant_fight_${team}_109-109.gif?v=${giant.isInCombat}`;
                      } else {
                        // Mode marche - déterminer la direction
                        const isMovingDown = giant.targetPosition.row > giant.position.row;
                        const isMovingUp = giant.targetPosition.row < giant.position.row;
                        
                        let gifType;
                        if (isMovingDown) {
                          gifType = 'opponent'; // Vers le bas = opponent
                        } else if (isMovingUp) {
                          gifType = 'player'; // Vers le haut = player
                        } else {
                          // Mouvement horizontal ou statique, utiliser selon l'équipe
                          gifType = giant.team === 'red' ? 'player' : 'opponent';
                        }
                        
                        gifPath = `/images/troops/giant/Giant_walk_${gifType}_109-109.gif?v=${giant.isInCombat}`;
                      }
                      
                      return (
                        <div
                          key={giant.id}
                          className={`absolute z-20 w-full h-full flex items-center justify-center pointer-events-none`}
                          style={{
                            transform: `translate(${(giant.position.col - Math.floor(giant.position.col)) * 100}%, ${(giant.position.row - Math.floor(giant.position.row)) * 100}%)`
                          }}
                        >
                          {/* GIF du Giant */}
                          <img
                            key={`${giant.id}-${giant.isInCombat ? 'combat' : 'walk'}`}
                            src={gifPath}
                            alt={`Giant ${giant.team}`}
                            className="w-12 h-12 object-contain"
                            style={{
                              transform: 'scale(3)'
                            }}
                          />
                          
                          {/* Barre de vie */}
                          <div className="absolute -top-2 left-0 w-full h-1 bg-gray-600 rounded">
                            <div 
                              className={`h-full rounded transition-all duration-200 ${
                                giant.team === 'red' ? 'bg-red-400' : 'bg-blue-400'
                              }`}
                              style={{ width: `${(giant.health / giant.maxHealth) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Contrôles du jeu */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="space-x-2">
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
            <Button 
              variant="secondary" 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
              onClick={() => setHighlightFlaggedCells(!highlightFlaggedCells)}
            >
              Highlight Flagged Cells
            </Button>
          </div>
          
          {/* Contrôles de jeu */}
          <div className="space-x-2">
            {!isGameRunning ? (
              <Button 
                variant="secondary" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                onClick={startGame}
              >
                Start Game
              </Button>
            ) : (
              <>
                {isGamePaused ? (
                  <Button 
                    variant="secondary" 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={resumeGame}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={pauseGame}
                  >
                    Pause
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                  onClick={stopGame}
                >
                  Stop
                </Button>
              </>
            )}
          </div>
          
          {/* Spawn Giants */}
          {isGameRunning && (
            <div className="space-x-2">
              {!spawnMode.active ? (
                <>
                  <Button 
                    variant="secondary" 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('red')}
                  >
                    Spawn Red Giant
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('blue')}
                  >
                    Spawn Blue Giant
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${spawnMode.team === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    Click on a cell to spawn {spawnMode.team} giant
                  </span>
                  <Button 
                    variant="secondary" 
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded transition-colors duration-200"
                    onClick={deactivateSpawnMode}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Stats du jeu */}
        {isGameRunning && (
          <div className="absolute top-4 right-4 z-10 bg-black/70 text-white p-4 rounded-lg">
            <div className="text-sm space-y-1">
              <div>Giants: {gameStats.livingGiants}/{gameStats.totalGiants}</div>
              <div>Red: {gameStats.redGiants} | Blue: {gameStats.blueGiants}</div>
              <div>Time: {Math.floor(gameStats.gameTime)}s</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
