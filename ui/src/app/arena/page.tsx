"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { useGameEngine } from "@/game/useGameEngine";
import TowerHealthBar from "@/components/TowerHealthBar";
import ClashTimer from "@/components/ClashTimer";
import GameEndScreen from "@/components/GameEndScreen";
import { TroopType, TROOP_CONFIGS } from "@/game/types/Troop";
import { gameEngine } from "@/game/GameEngine";

export default function Arena() {
  const showFlaggedCells = false;
  const showGrid = false;

  const numRows = 34;
  const numCols = 18;

  const [spawnMode, setSpawnMode] = useState<{active: boolean, team: 'red' | 'blue' | null, troopType: TroopType | null}>({
    active: false,
    team: null,
    troopType: null
  });

  const isArenaVisible = true; // L'arène est immédiatement visible pour éviter les délais de transition
   
  // Configuration des tours - mémorisé pour éviter les re-rendus
  const TOWER = React.useMemo(() => ({
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
  }), []);

  // Convertir TOWER en format compatible avec le moteur de jeu
  const towersForGame = Object.values(TOWER).map(tower => ({
    id: tower.id,
    type: tower.type as 'king' | 'princess',
    team: tower.team as 'red' | 'blue',
    row: tower.row,
    col: tower.col,
    health: tower.type === 'king' ? 4824 : 3052,
    maxHealth: tower.type === 'king' ? 4824 : 3052,
    isAlive: true,
    active: true,
    position: { row: tower.row, col: tower.col },
    offsetX: tower.offsetX,
    offsetY: tower.offsetY
  }));
  
  // Initialiser les tours dans le GameEngine
  React.useEffect(() => {
    // Ajouter toutes les tours au GameEngine
    Object.values(TOWER).forEach(tower => {
      gameEngine.addTower(tower.id, tower.type as 'king' | 'princess', tower.team as 'red' | 'blue', tower.row, tower.col);
    });
    
    return () => {
      // Nettoyer les tours à la destruction du composant
      Object.values(TOWER).forEach(tower => {
        gameEngine.removeTower(tower.id);
      });
    };
  }, [TOWER]);
  
  // Hook du moteur de jeu
  const { 
    troops,
    towers: gameEngineTowers,
    spawnTroop,
    startGame, 
    pauseGame, 
    resumeGame, 
    stopGame,
    resetGame,
    isGameRunning,
    isGamePaused,
    gameEnded,
    winner
  } = useGameEngine(towersForGame, undefined);

  // Fonction pour obtenir toutes les cellules marquées des tours actives
  const getActiveTowersFlaggedCells = React.useCallback(() => {
    const flaggedCells = new Set<string>();
    
    Object.values(TOWER).forEach(tower => {
      // Vérifier si la tour est encore vivante dans le GameEngine
      const gameEngineTower = gameEngineTowers.find(t => t.id === tower.id);
      const isTowerAlive = !gameEngineTower || gameEngineTower.isAlive;
      
      if (tower.active && tower.flagged_cells && isTowerAlive) {
        tower.flagged_cells.forEach(([row, col]) => {
          flaggedCells.add(`${row}-${col}`);
        });
      }
    });
    
    return flaggedCells;
  }, [gameEngineTowers, TOWER]);

  // Obtenir les flagged cells pour le moteur de jeu - mis à jour quand les tours changent
  const flaggedCells = React.useMemo(() => getActiveTowersFlaggedCells(), [getActiveTowersFlaggedCells]);

  // Connecter les flagged cells au moteur de jeu quand elles changent
  React.useEffect(() => {
    if (flaggedCells) {
      gameEngine.connectFlaggedCells(flaggedCells);
    }
  }, [flaggedCells]);

  // Fonctions pour le mode spawn
  const activateSpawnMode = (team: 'red' | 'blue', troopType: TroopType) => {
    setSpawnMode({ active: true, team, troopType });
  };

  const deactivateSpawnMode = () => {
    setSpawnMode({ active: false, team: null, troopType: null });
  };

  const handleCellClick = (row: number, col: number) => {
    if (spawnMode.active && spawnMode.team && spawnMode.troopType && isGameRunning) {
      spawnTroop(spawnMode.troopType, spawnMode.team, row, col);
      deactivateSpawnMode();
    } else {
      console.log(`Cell ${row}, ${col}`);
    }
  };

  // Fonction pour obtenir le GIF path d'une troupe
  const getTroopGifPath = (troop: any) => {
    const config = TROOP_CONFIGS[troop.type as TroopType];
    if (!config) return null;

    if (troop.isInCombat) {
      // En combat : utiliser la position relative de la cible
      // Si la cible est au-dessus (row plus petite), utiliser "player", sinon "opponent"
      const targetIsAbove = troop.targetPosition.row < troop.position.row;
      const gifType = targetIsAbove ? 'player' : 'opponent';
      return `${config.gifPaths.fight[gifType as 'player' | 'opponent']}?v=${troop.isInCombat}`;
    } else {
      // Mode marche - déterminer la direction
      const isMovingDown = troop.targetPosition.row > troop.position.row;
      const isMovingUp = troop.targetPosition.row < troop.position.row;
      
      let gifType: 'player' | 'opponent';
      if (isMovingDown) {
        gifType = 'opponent'; // Vers le bas = opponent
      } else if (isMovingUp) {
        gifType = 'player'; // Vers le haut = player
      } else {
        // Mouvement horizontal ou statique, utiliser selon l'équipe
        gifType = troop.team === 'red' ? 'player' : 'opponent';
      }
      
      return `${config.gifPaths.walk[gifType]}?v=${troop.isInCombat}`;
    }
  };

  // Fonction de redémarrage du jeu
  const handleRestart = () => {
    resetGame();
    // Redémarrer le jeu après un court délai
    setTimeout(() => {
      startGame();
    }, 100);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-opacity duration-1000 ${
      isArenaVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Fond flou */}
      <img
        src="/images/backgrounds/arena_in_game.png"
        alt="Goal Background Blurred"
        className="absolute inset-0 w-full h-full object-cover blur-sm"
      />
      
      {/* Écran de fin de partie */}
      {gameEnded && winner && (
        <GameEndScreen 
          winner={winner} 
          onRestart={handleRestart}
        />
      )}
      
      {/* Container avec ratio 9/16 */}
      <div className="relative w-[56.25vh] h-screen max-w-full max-h-screen z-10">
        <img
          src="/images/backgrounds/arena_in_game.png"
          alt="Arena In Game"
          className="w-full h-full object-cover"
        />

        {/* Damier interactif */}
        <div className="absolute inset-0 pl-[12%] pr-[16.3%] pt-[44.3%] pb-[30.4%]">
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
                  className={`w-full h-full transition-all duration-200 relative bg-transparent ${
                    spawnMode.active 
                      ? `cursor-crosshair ${
                          spawnMode.team === 'red' 
                            ? 'hover:bg-red-400/50 hover:ring-2 ring-red-400' 
                            : 'hover:bg-blue-400/50 hover:ring-2 ring-blue-400'
                        }`
                      : 'cursor-pointer'
                  } ${
                    showFlaggedCells && isFlagged 
                      ? 'bg-red-500/70 hover:bg-red-400/80 hover:ring-2 ring-red-300'
                      : showGrid && isEven 
                        ? 'bg-white/10 hover:bg-white/20 hover:ring-2 ring-yellow-400 ring-opacity-50'  
                        : 'bg-black/20 hover:bg-black/30 hover:ring-2 ring-yellow-400 ring-opacity-50'
                  }`}
                  onClick={() => handleCellClick(row, col)}
                >
                  {towerImage && (() => {
                    // Vérifier si la tour est morte dans le GameEngine
                    const gameEngineTower = gameEngineTowers.find(t => t.id === tower?.id);
                    const isTowerDead = gameEngineTower && !gameEngineTower.isAlive;
                    
                    return !isTowerDead ? (
                      <>
                        <img
                          src={towerImage}
                          alt={tower?.name}
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none object-contain"
                          style={{
                            transform: `scale(${tower?.size}) translate(${tower?.offsetX}px, ${tower?.offsetY}px)`
                          }}
                        />
                      {/* Health Bar pour chaque tour */}
                      <div 
                        className="absolute z-20 pointer-events-none"
                        style={{
                          left: `${(tower as any).offsetX - 16}px`,
                          top: `${(tower as any).type === 'king' ? 
                            ((tower as any).team === 'blue' ? +20 : -60) : 
                            ((tower as any).team === 'blue' ? (tower as any).offsetY : (tower as any).offsetY - 40)}px`,
                        }}
                      >
                        {(() => {
                          // Trouver les données réelles de la tour dans le GameEngine
                          const gameEngineTower = gameEngineTowers.find(t => t.id === tower?.id);
                          const currentHealth = gameEngineTower?.health || (tower?.type === 'king' ? 4825 : 3052);
                          const maxHealth = gameEngineTower?.maxHealth || (tower?.type === 'king' ? 4825 : 3052);
                          
                          return (
                            <TowerHealthBar
                              currentHealth={currentHealth}
                              maxHealth={maxHealth}
                              isKing={tower?.type === 'king'}
                              team={(tower?.team as 'red' | 'blue') || 'red'}
                            />
                          );
                        })()}
                      </div>
                      </>
                    ) : null;
                  })()}
                  
                  {/* Rendu des troupes sur cette cellule */}
                  {troops
                    .filter(troop => 
                      Math.floor(troop.position.row) === row && 
                      Math.floor(troop.position.col) === col
                    )
                    .map(troop => {
                      const gifPath = getTroopGifPath(troop);
                      const config = TROOP_CONFIGS[troop.type as TroopType];
                      
                      if (!gifPath || !config) return null;
                      
                      return (
                        <div
                          key={troop.id}
                          className={`absolute z-20 w-full h-full flex items-center justify-center pointer-events-none`}
                          style={{
                            transform: `translate(${(troop.position.col - Math.floor(troop.position.col)) * 100}%, ${(troop.position.row - Math.floor(troop.position.row)) * 100}%)`
                          }}
                        >
                          {/* GIF de la troupe */}
                          <img
                            key={`${troop.id}-${troop.isInCombat ? 'combat' : 'walk'}`}
                            src={gifPath}
                            alt={`${troop.type} ${troop.team}`}
                            className="w-12 h-12 object-contain"
                            style={{
                              transform: `scale(${config.scale})`
                            }}
                          />
                          
                          {/* Barre de vie */}
                          <div className="absolute -top-2 left-0 w-full h-1 bg-gray-600 rounded">
                            <div 
                              className={`h-full rounded transition-all duration-200 ${
                                troop.team === 'red' ? 'bg-red-400' : 'bg-blue-400'
                              }`}
                              style={{ width: `${(troop.health / troop.maxHealth) * 100}%` }}
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
        
        {/* Timer du jeu */}
        <div className=" absolute top-4 right-4 z-10">
          <ClashTimer />
        </div>

        {/* Contrôles du jeu */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          
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
          
          {/* Spawn Troops */}
          {isGameRunning && (
            <div className="grid grid-cols-2 gap-2">
              {!spawnMode.active ? (
                <>
                  {/* Boutons pour Giants */}
                  <Button 
                    variant="secondary" 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('red', TroopType.GIANT)}
                  >
                    Red Giant
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('blue', TroopType.GIANT)}
                  >
                    Blue Giant
                  </Button>
                  {/* Boutons pour Baby Dragons */}
                  <Button 
                    variant="secondary" 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('red', TroopType.BABY_DRAGON)}
                  >
                    Red Dragon
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('blue', TroopType.BABY_DRAGON)}
                  >
                    Blue Dragon
                  </Button>
                  {/* Boutons pour Mini Pekkas */}
                  <Button 
                    variant="secondary" 
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('red', TroopType.MINI_PEKKA)}
                  >
                    Red MiniPekka
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('blue', TroopType.MINI_PEKKA)}
                  >
                    Blue MiniPekka
                  </Button>
                  {/* Boutons pour Valkyries */}
                  <Button 
                    variant="secondary" 
                    className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('red', TroopType.VALKYRIE)}
                  >
                    Red Valkyrie
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20"
                    onClick={() => activateSpawnMode('blue', TroopType.VALKYRIE)}
                  >
                    Blue Valkyrie
                  </Button>
                </>
              ) : (
                <div className="col-span-2 flex items-center space-x-2">
                  <span className={`text-sm font-bold ${spawnMode.team === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    Click on a cell to spawn {spawnMode.team} {spawnMode.troopType}
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
      </div>
    </div>
  );
}
