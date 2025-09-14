"use client";

import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import TowerHealthBar from "@/components/TowerHealthBar";
import ClashTimer from "@/components/ClashTimer";
import GameEndScreen from "@/components/GameEndScreen";
import { TroopType, TROOP_CONFIGS } from "@/game/types/Troop";
import { useSearchParams, useRouter } from "next/navigation";
import { GameState } from "@/lib/gameStore";

export default function Arena() {
  const showGrid = false;
  const numRows = 34;
  const numCols = 18;

  const [currentTeam, setCurrentTeam] = useState<'red' | 'blue'>('red');
  const [draggedCard, setDraggedCard] = useState<{troopType: TroopType, team: 'red' | 'blue'} | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const gameId = params.get("game_id");
  const [gameState, setGameState] = useState<GameState | null>(null);

  const isArenaVisible = true;

  // Tour visuals (pour flags + sprites)
  const TOWER = React.useMemo(() => ({
    KING_RED: {
      id: 'king_red', name: 'King Red', image: '/images/towers/king_red.png',
      row: 2, col: 8, size: 6.5, offsetX: 1.4, offsetY: -2.8, team: 'red', type: 'king',
      flagged_cells: [[1,7],[1,8],[1,9],[1,10],[2,10],[2,9],[2,8],[2,7],[3,7],[3,8],[3,9],[3,10],[4,10],[4,9],[4,8],[4,7]],
      active: true,
    },
    PRINCESS_RED_1: {
      id: 'princess_red_left', name: 'Princess Red', image: '/images/towers/princess_red.png',
      row: 6, col: 3, size: 4, offsetX: -0.7, offsetY: -3.3, team: 'red', type: 'princess',
      flagged_cells: [[5,2],[5,3],[5,4],[6,4],[7,4],[7,3],[7,2],[6,2],[6,3]], active: true,
    },
    PRINCESS_RED_2: {
      id: 'princess_red_right', name: 'Princess Red', image: '/images/towers/princess_red.png',
      row: 6, col: 14, size: 4, offsetX: 0, offsetY: -3.3, team: 'red', type: 'princess',
      flagged_cells: [[5,13],[5,14],[5,15],[6,15],[6,14],[6,13],[7,13],[7,14],[7,15]], active: true,
    },
    PRINCESS_BLUE_1: {
      id: 'princess_blue_left', name: 'Princess Blue', image: '/images/towers/princess_blue.png',
      row: 27, col: 3, size: 7.4, offsetX: -0.4, offsetY: -2, team: 'blue', type: 'princess',
      flagged_cells: [[26,2],[26,3],[26,4],[27,4],[27,3],[27,2],[28,2],[28,3],[28,4]], active: true,
    },
    PRINCESS_BLUE_2: {
      id: 'princess_blue_right', name: 'Princess Blue', image: '/images/towers/princess_blue.png',
      row: 27, col: 14, size: 7.4, offsetX: 0, offsetY: -2, team: 'blue', type: 'princess',
      flagged_cells: [[26,13],[26,14],[26,15],[27,15],[27,14],[27,13],[28,13],[28,14],[28,15]], active: true,
    },
    KING_BLUE: {
      id: 'king_blue', name: 'King Blue', image: '/images/towers/king_blue.png',
      row: 31, col: 8, size: 6.5, offsetX: 1, offsetY: -2, team: 'blue', type: 'king',
      flagged_cells: [[30,7],[31,7],[32,7],[33,7],[33,8],[32,8],[31,8],[30,8],[30,9],[30,10],[31,10],[31,9],[32,9],[32,10],[33,10],[33,9]],
      active: true,
    }
  }), []);

  // Si pas d'ID -> retour au menu
  useEffect(() => {
    if (!gameId) router.replace("/");
  }, [gameId, router]);

  // Poller l'état du jeu
  useEffect(() => {
    if (!gameId) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/game/${gameId}/state`);
        const data = await res.json();
        setGameState(data);
      } catch (error) {
        console.error("Failed to fetch game state:", error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameId]);

  const handleCardDragStart = (troopType: TroopType) => setDraggedCard({ troopType, team: currentTeam });
  const handleCardDragEnd = () => setDraggedCard(null);
  
  const handleCellDrop = async (row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedCard && gameId) {
      try {
        await fetch("/api/game/spawn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: gameId,
            troop_type: draggedCard.troopType,
            position: { row, col },
            team: draggedCard.team,
          }),
        });
        setDraggedCard(null);
      } catch (error) {
        console.error("Failed to spawn troop:", error);
      }
    }
  };
  
  const handleCellDragOver = (e: React.DragEvent) => e.preventDefault();
  const switchTeam = () => setCurrentTeam(currentTeam === 'red' ? 'blue' : 'red');

  const getTroopGifPath = (troop: any) => {
    const config = TROOP_CONFIGS[troop.type as TroopType];
    if (!config) return null;
    // Pour l'instant, utiliser les chemins de marche par défaut
    const gifType = troop.team === 'red' ? 'player' : 'opponent';
    return `${config.gifPaths.walk[gifType]}?v=${troop.id}`;
  };

  const handleRestart = () => {
    router.push("/");
  };

  if (!gameId) return null; // évite de rendre l'arène le temps de la redirection
  if (!gameState) return <div>Loading game...</div>;

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-opacity duration-1000 ${isArenaVisible ? 'opacity-100' : 'opacity-0'}`}>
      <img src="/images/backgrounds/arena_in_game.png" alt="Goal Background Blurred" className="absolute inset-0 w-full h-full object-cover blur-sm" />

      {gameState.is_game_over && gameState.winner && <GameEndScreen winner={gameState.winner as "red" | "blue"} onRestart={handleRestart} />}

      <div className="relative w-[56.25vh] mb-10 h-screen max-w-full max-h-screen z-10">
        <img src="/images/backgrounds/arena_in_game.png" alt="Arena In Game" className="w-full h-full object-cover" />

        <div className="absolute inset-0 pl-[10%] pr-[9.8%] pt-[27.8%] pb-[34.2%]">
          <div className={`w-full h-full grid gap-0`} style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)`, gridTemplateRows: `repeat(${numRows}, 1fr)` }}>
            {Array.from({ length: numRows * numCols }, (_, index) => {
              const row = Math.floor(index / numCols);
              const col = index % numCols;
              const isEven = (row + col) % 2 === 0;
              const towerPosition = Object.values(TOWER).find(pos => row === pos.row && col === pos.col);
              const shouldShowTower = !!towerPosition;
              const tower = towerPosition || null;

              return (
                <div
                  key={index}
                  className={`w-full h-full transition-all duration-200 relative ${!showGrid ? 'bg-transparent' : 'bg-black/20'}
                    ${
                      draggedCard 
                        ? `cursor-crosshair ${draggedCard.team === 'red' ? 'hover:bg-red-400/50 hover:ring-2 ring-red-400' : 'hover:bg-blue-400/50 hover:ring-2 ring-blue-400'}`
                        : 'cursor-default'
                    } ${
                      isEven ? 'bg-white/10 hover:bg-white/20 hover:ring-2 ring-yellow-400 ring-opacity-50'
                             : 'bg-black/20 hover:bg-black/30 hover:ring-2 ring-yellow-400 ring-opacity-50'
                    }`}
                  onDrop={(e) => handleCellDrop(row, col, e)}
                  onDragOver={handleCellDragOver}
                >
                  {shouldShowTower && (() => {
                    const engineTower = gameState.towers[tower!.id];
                    const dead = engineTower && engineTower.health <= 0;
                    if (dead) return null;

                    return (
                      <>
                        <img
                          src={tower!.image}
                          alt={tower!.name}
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none object-contain"
                          style={{ transform: `scale(${tower!.size}) translate(${tower!.offsetX}px, ${tower!.offsetY}px)` }}
                        />
                        <div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${(tower as any).offsetX - 16}px`,
                            top: `${
                              (tower as any).type === 'king'
                                ? ((tower as any).team === 'blue' ? 20 : -60)
                                : ((tower as any).team === 'blue' ? (tower as any).offsetY : (tower as any).offsetY - 40)
                            }px`,
                          }}
                        >
                          {(() => {
                            const t = engineTower;
                            const currentHealth = t?.health || ((tower as any).type === 'king' ? 4825 : 3052);
                            const maxHealth = t?.max_health || ((tower as any).type === 'king' ? 4825 : 3052);
                            return <TowerHealthBar currentHealth={currentHealth} maxHealth={maxHealth} team={(tower as any).team} />;
                          })()}
                        </div>
                      </>
                    );
                  })()}

                  {gameState.troops
                    .filter(troop => Math.floor(troop.position.row) === row && Math.floor(troop.position.col) === col)
                    .map(troop => {
                      const gifPath = getTroopGifPath(troop);
                      const config = TROOP_CONFIGS[troop.type as TroopType];
                      if (!gifPath || !config) return null;
                      return (
                        <div
                          key={troop.id}
                          className="absolute z-20 w-full h-full flex items-center justify-center pointer-events-none"
                          style={{ transform: `translate(${(troop.position.col - Math.floor(troop.position.col)) * 100}%, ${(troop.position.row - Math.floor(troop.position.row)) * 100}%)` }}
                        >
                          <img
                            key={`${troop.id}-walk`}
                            src={gifPath}
                            alt={`${troop.type} ${troop.team}`}
                            className="w-12 h-12 object-contain"
                            style={{
                              transform: `scale(${typeof config.scale === 'object' ? config.scale.walk : config.scale})`,
                            }}
                          />
                          <div className="absolute -top-2 left-0 w-full h-1 bg-gray-600 rounded">
                            <div
                              className={`h-full rounded transition-all duration-200 ${troop.team === 'red' ? 'bg-red-400' : 'bg-blue-400'}`}
                              style={{ width: `${(troop.health / troop.max_health) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <ClashTimer />
        </div>

        {/* Barre de cartes */}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-center items-end pb-4">
            <div className="relative w-[80%] max-w-md">
              <img src="/images/cards/more/card_box.png" alt="Card Box" className="w-full h-44 object-fill rounded-t-lg" />
              <div className="absolute inset-0 grid grid-cols-4 gap-1.5 pl-[4.5%] pr-[4%] pb-[5.5%] items-stretch">
                {/* Baby Dragon */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !gameState ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-yellow-400 hover:ring-opacity-80'
                  }`}
                  draggable={!!gameState}
                  onDragStart={() => handleCardDragStart(TroopType.BABY_DRAGON)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/BabyDragonCard.png" alt={`${currentTeam} Baby Dragon`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Mini PEKKA */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !gameState ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 hover:ring-opacity-80'
                  }`}
                  draggable={!!gameState}
                  onDragStart={() => handleCardDragStart(TroopType.MINI_PEKKA)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/MiniPEKKACard.png" alt={`${currentTeam} Mini PEKKA`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Giant */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !gameState ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-orange-400 hover:ring-opacity-80'
                  }`}
                  draggable={!!gameState}
                  onDragStart={() => handleCardDragStart(TroopType.GIANT)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/GiantCard.png" alt={`${currentTeam} Giant`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Valkyrie */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !gameState ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-red-400 hover:ring-opacity-80'
                  }`}
                  draggable={!!gameState}
                  onDragStart={() => handleCardDragStart(TroopType.VALKYRIE)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/ValkyrieCard.png" alt={`${currentTeam} Valkyrie`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          variant="secondary"
          className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20 ${
            currentTeam === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={switchTeam}
        >
          Team: {currentTeam === 'red' ? 'Red' : 'Blue'}
        </Button>

        <div className="text-center">
          <div className="bg-black/50 rounded-lg p-3 border border-white/20">
            <p className="text-white text-sm font-medium">
              Drag cards from the bottom to spawn {currentTeam} troops
            </p>
            <p className="text-gray-300 text-xs mt-1">Switch team with the button above</p>
            <p className="text-yellow-400 text-xs mt-1">
              Elixir: {currentTeam === 'red' ? gameState.elixir.red : gameState.elixir.blue}/10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}