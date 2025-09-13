"use client";

import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import TowerHealthBar from "@/components/TowerHealthBar";
import ClashTimer from "@/components/ClashTimer";
import GameEndScreen from "@/components/GameEndScreen";
import { TroopType, TROOP_CONFIGS } from "@/game/types/Troop";
import { ServerSyncEngine } from "@/game/ServerSyncEngine";

export default function AIArena() {
  const [gameEngine, setGameEngine] = useState<ServerSyncEngine | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [troops, setTroops] = useState<any[]>([]);
  const [towers, setTowers] = useState<any[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<'red' | 'blue' | null>(null);
  const [tacticalAnalysis, setTacticalAnalysis] = useState<string>('');
  const [draggedCard, setDraggedCard] = useState<{troopType: TroopType, team: 'red' | 'blue'} | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);

  const showGrid = false;
  const numRows = 34;
  const numCols = 18;
  const isArenaVisible = true;

  // Tower configuration (same as regular arena)
  const TOWER = React.useMemo(() => ({
    KING_RED: {
      id: 'king_red',
      name: 'King Red',
      image: '/images/towers/king_red.png',
      row: 2,
      col: 8,
      size: 6.5,
      offsetX: 1.4,
      offsetY: -2.8,
      team: 'red',
      type: 'king',
      flagged_cells: [
        [1, 7], [1, 8], [1, 9], [1, 10],
        [2, 10], [2, 9], [2, 8], [2, 7],
        [3, 7], [3, 8], [3, 9], [3, 10],
        [4, 10], [4, 9], [4, 8], [4, 7],
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
      offsetY: -3.3,
      team: 'red',
      type: 'princess',
      flagged_cells: [
        [5, 2], [5, 3], [5, 4],
        [6, 4], [7, 4], [7, 3],
        [7, 2], [6, 2], [6, 3],
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
      offsetY: -3.3,
      team: 'red',
      type: 'princess',
      flagged_cells: [
        [5, 13], [5, 14], [5, 15],
        [6, 15], [6, 14], [6, 13],
        [7, 13], [7, 14], [7, 15],
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
        [26, 2], [26, 3], [26, 4],
        [27, 4], [27, 3], [27, 2],
        [28, 2], [28, 3], [28, 4],
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
        [26, 13], [26, 14], [26, 15],
        [27, 15], [27, 14], [27, 13],
        [28, 13], [28, 14], [28, 15],
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
        [29, 7], [30, 7], [31, 7], [32, 7],
        [32, 8], [31, 8], [30, 8], [29, 8],
        [29, 9], [29, 10], [30, 10], [30, 9],
        [31, 9], [31, 10], [32, 10], [32, 9],
      ],
      active: true,
    }
  }), []);

  // Initialize game with server
  useEffect(() => {
    const initGame = async () => {
      const engine = new ServerSyncEngine();

      try {
        const id = await engine.initializeServerGame(true); // AI mode enabled
        setGameId(id);
        setGameEngine(engine);

        // Set up callbacks
        engine.setOnUpdate((updatedTroops) => {
          console.log('🔄 Received troops update from engine:', {
            count: updatedTroops.length,
            troops: updatedTroops.map(t => ({
              id: t.id,
              type: t.type,
              team: t.team,
              position: t.position,
              health: t.health
            }))
          });
          setTroops(updatedTroops);
        });

        engine.setOnGameEnd((winner) => {
          setGameEnded(true);
          setWinner(winner);
        });

        // Start the game automatically
        engine.start();
        setIsGameRunning(true);
      } catch (error) {
        console.error('Failed to initialize AI game:', error);
      }
    };

    initGame();

    return () => {
      if (gameEngine) {
        gameEngine.stop();
      }
    };
  }, []);

  // Function to get troop GIF path (same as arena)
  const getTroopGifPath = (troop: any) => {
    const config = TROOP_CONFIGS[troop.type as TroopType];
    if (!config) return null;

    // For now, use walk animation as default
    // In combat: use fight animations
    if (troop.isInCombat) {
      // Use appropriate fight GIF based on team or position
      const gifType = troop.team === 'red' ? 'player' : 'opponent';
      return config.gifPaths?.fight?.[gifType] || config.gifPaths?.walk?.player;
    } else {
      // Use walk animation
      // Determine direction based on team (blue goes up, red goes down)
      const gifType = troop.team === 'blue' ? 'player' : 'opponent';
      return config.gifPaths?.walk?.[gifType] || config.gifPaths?.walk?.player;
    }
  };

  // Drag and drop handlers
  const handleCardDragStart = (troopType: TroopType) => {
    setDraggedCard({ troopType, team: 'blue' }); // Player is always blue in AI mode
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  const handleCellDrop = async (row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCard || !gameEngine || !isGameRunning) return;

    // Only allow blue team to spawn in their half
    if (row < 17) {
      console.warn('Can only spawn in your half (rows 17-33)');
      return;
    }

    await gameEngine.spawnTroopOnServer(draggedCard.troopType, 'blue', row, col);
    setDraggedCard(null);
  };

  const handleCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardClick = async (troopType: TroopType) => {
    if (!gameEngine || !isGameRunning) return;

    // Default spawn position for blue team
    const row = 25;
    const col = 8;

    await gameEngine.spawnTroopOnServer(troopType, 'blue', row, col);
  };

  const startGame = () => {
    if (gameEngine) {
      gameEngine.start();
      setIsGameRunning(true);
      setIsGamePaused(false);
    }
  };

  const pauseGame = () => {
    if (gameEngine) {
      gameEngine.pause();
      setIsGamePaused(true);
    }
  };

  const resumeGame = () => {
    if (gameEngine) {
      gameEngine.resume();
      setIsGamePaused(false);
    }
  };

  const stopGame = () => {
    if (gameEngine) {
      gameEngine.stop();
      setIsGameRunning(false);
      setIsGamePaused(false);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // Debug logging for troops state
  console.log('🎯 Current troops state in render:', {
    count: troops.length,
    troops: troops.map(t => ({
      id: t.id,
      type: t.type,
      team: t.team,
      position: t.position
    }))
  });

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-opacity duration-1000 ${
      isArenaVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background blur */}
      <img
        src="/images/backgrounds/arena_in_game.png"
        alt="Arena Background Blurred"
        className="absolute inset-0 w-full h-full object-cover blur-sm z-0"
      />

      {/* Game end screen */}
      {gameEnded && winner && (
        <GameEndScreen
          winner={winner}
          onRestart={handleRestart}
        />
      )}

      {/* Container with 9:16 ratio */}
      <div className="relative w-[56.25vh] mb-10 h-screen max-w-full max-h-screen z-10">
        <img
          src="/images/backgrounds/arena_in_game.png"
          alt="Arena In Game"
          className="w-full h-full object-cover"
        />

        {/* Interactive grid */}
        <div className="absolute inset-0 pl-[10%] pr-[9.8%] pt-[27.8%] pb-[34.2%]">
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

              const shouldShowTower = towerPosition && (
                row === towerPosition.row && col === towerPosition.col
              );

              const towerImage = shouldShowTower ? towerPosition.image : null;
              const tower = towerPosition;

              return (
                <div
                  key={index}
                  className={`w-full h-full transition-all duration-200 relative ${!showGrid ? 'bg-transparent' : 'bg-black/20'}
                      ${
                     draggedCard
                       ? `cursor-crosshair ${
                           draggedCard.team === 'blue'
                             ? 'hover:bg-blue-400/50 hover:ring-2 ring-blue-400'
                             : 'hover:bg-red-400/50 hover:ring-2 ring-red-400'
                         }`
                       : 'cursor-default'
                   } ${
                     isEven
                         ? 'bg-white/10 hover:bg-white/20 hover:ring-2 ring-yellow-400 ring-opacity-50'
                         : 'bg-black/20 hover:bg-black/30 hover:ring-2 ring-yellow-400 ring-opacity-50'
                   }`}
                   onDrop={(e) => handleCellDrop(row, col, e)}
                   onDragOver={handleCellDragOver}
                >
                  {towerImage && (
                    <>
                      <img
                        src={towerImage}
                        alt={tower?.name}
                        className="absolute inset-0 w-full h-full z-10 pointer-events-none object-contain"
                        style={{
                          transform: `scale(${tower?.size}) translate(${tower?.offsetX}px, ${tower?.offsetY}px)`
                        }}
                      />
                      {/* Health Bar for each tower */}
                      <div
                        className="absolute z-20 pointer-events-none"
                        style={{
                          left: `${(tower as any).offsetX - 16}px`,
                          top: `${(tower as any).type === 'king' ?
                            ((tower as any).team === 'blue' ? +20 : -60) :
                            ((tower as any).team === 'blue' ? (tower as any).offsetY : (tower as any).offsetY - 40)}px`,
                        }}
                      >
                        <TowerHealthBar
                          currentHealth={tower?.type === 'king' ? 4825 : 3052}
                          maxHealth={tower?.type === 'king' ? 4825 : 3052}
                          team={(tower?.team as 'red' | 'blue') || 'red'}
                        />
                      </div>
                    </>
                  )}

                  {/* Render troops on this cell */}
                  {troops
                    .filter(troop => {
                      if (!troop.position) {
                        console.log('Troop has no position:', troop);
                        return false;
                      }
                      const matches = Math.floor(troop.position.row) === row && Math.floor(troop.position.col) === col;
                      if (matches) {
                        console.log(`Troop ${troop.id} matches cell (${row}, ${col})`);
                      }
                      return matches;
                    })
                    .map(troop => {
                      const gifPath = getTroopGifPath(troop);
                      const config = TROOP_CONFIGS[troop.type as TroopType];

                      console.log(`Rendering troop ${troop.id}:`, {
                        type: troop.type,
                        config: config,
                        gifPath: gifPath
                      });

                      if (!gifPath || !config) {
                        console.error(`Missing config or gif for troop type: ${troop.type}`);
                        return null;
                      }

                      return (
                        <div
                          key={troop.id}
                          className={`absolute z-20 w-full h-full flex items-center justify-center pointer-events-none`}
                          style={{
                            transform: `translate(${(troop.position.col - Math.floor(troop.position.col)) * 100}%, ${(troop.position.row - Math.floor(troop.position.row)) * 100}%)`
                          }}
                        >
                          {/* Troop image */}
                          <img
                            src={gifPath}
                            alt={`${troop.type} ${troop.team}`}
                            className="w-12 h-12 object-contain"
                            style={{
                              transform: `scale(${config.scale || 1})`
                            }}
                          />

                          {/* Health bar */}
                          <div className="absolute -top-2 left-0 w-full h-1 bg-gray-600 rounded">
                            <div
                              className={`h-full rounded transition-all duration-200 ${
                                troop.team === 'red' ? 'bg-red-400' : 'bg-blue-400'
                              }`}
                              style={{ width: `${(troop.health / (troop.maxHealth || 100)) * 100}%` }}
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

        {/* Game timer */}
        <div className="absolute top-4 right-4 z-10">
          <ClashTimer />
        </div>

        {/* AI Mode Indicator */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
          AI Mode - Mistral is Red Team (Top)
        </div>

        {/* Game ID Display */}
        {gameId && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-xs">
            Game ID: {gameId.slice(0, 8)}
          </div>
        )}

        {/* Tactical Analysis */}
        {tacticalAnalysis && (
          <div className="absolute top-44 left-4 right-4 bg-black/70 text-white p-2 rounded text-xs">
            {tacticalAnalysis}
          </div>
        )}

        {/* Card bar at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-center items-end pb-4">
            {/* Container with background */}
            <div className="relative w-[80%] max-w-md">
              <img
                src="/images/cards/more/card_box.png"
                alt="Card Box"
                className="w-full h-44 object-fill rounded-t-lg"
              />

              {/* Cards grid */}
              <div className="absolute inset-0 grid grid-cols-4 gap-1.5 pl-[4.5%] pr-[4%] pb-[5.5%] items-stretch">
                {/* Baby Dragon Card */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-yellow-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.BABY_DRAGON)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => handleCardClick(TroopType.BABY_DRAGON)}
                >
                  <img
                    src="/images/cards/more/BabyDragonCard.png"
                    alt="Baby Dragon"
                    className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                  />
                </div>

                {/* Mini PEKKA Card */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.MINI_PEKKA)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => handleCardClick(TroopType.MINI_PEKKA)}
                >
                  <img
                    src="/images/cards/more/MiniPEKKACard.png"
                    alt="Mini PEKKA"
                    className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                  />
                </div>

                {/* Giant Card */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-orange-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.GIANT)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => handleCardClick(TroopType.GIANT)}
                >
                  <img
                    src="/images/cards/more/GiantCard.png"
                    alt="Giant"
                    className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                  />
                </div>

                {/* Valkyrie Card */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-red-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.VALKYRIE)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => handleCardClick(TroopType.VALKYRIE)}
                >
                  <img
                    src="/images/cards/more/ValkyrieCard.png"
                    alt="Valkyrie"
                    className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game controls */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="text-center">
            <div className="bg-black/50 rounded-lg p-3 border border-white/20">
              <p className="text-white text-sm font-medium">
                You are Blue Team (Bottom) - Drag cards to spawn troops
              </p>
              <p className="text-gray-300 text-xs mt-1">
                AI (Mistral) plays as Red Team (Top)
              </p>
            </div>
          </div>

          {/* Game control buttons */}
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
        </div>
      </div>
    </div>
  );
}