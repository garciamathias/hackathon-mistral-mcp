"use client";

import { Button } from "@/components/ui/button";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameEngine } from "@/game/useGameEngine";
import { useOnlineGame } from "@/hooks/useOnlineGame";

import TowerHealthBar from "@/components/TowerHealthBar";
import ClashTimer from "@/components/ClashTimer";
import GameEndScreen from "@/components/GameEndScreen";
import { TroopType, TROOP_CONFIGS } from "@/game/types/Troop";
import { gameEngine } from "@/game/GameEngine";
import { GameStatus } from "@/types/backend";
// État renvoyé par l'API locale /api/game/[id]/state
type BackendGameState = {
  troops: any[];
  towers: Record<string, { id: string; team: 'red'|'blue'; type: 'king'|'princess'; health: number; max_health: number; position: {row:number; col:number} }>;
  is_game_over: boolean;
  winner: 'red' | 'blue' | null;
  [k: string]: any;
};

function ArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOnlineMode = searchParams.get('mode') === 'online';
  const [onlineMatchId, setOnlineMatchId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);


  const showGrid = false;
  const numRows = 34;
  const numCols = 18;

  const [currentTeam, setCurrentTeam] = useState<'red' | 'blue'>('red');
  const [draggedCard, setDraggedCard] = useState<{troopType: TroopType, team: 'red' | 'blue'} | null>(null);
  const params = useSearchParams();
  const gameId = params.get("game_id");
  const [gameState, setGameState] = useState<BackendGameState | null>(null);

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
    offsetY: tower.offsetY,
    lastAttackTime: 0,
    isAttacking: false,
    canAttack: true
  }));
  
  // Local game hook
  const localGame = useGameEngine(towersForGame, undefined);

  // Online game hook
  const onlineGame = useOnlineGame();

  // Initialize online game if in online mode
  useEffect(() => {
    if (isOnlineMode) {
      const matchId = sessionStorage.getItem('matchId');
      const isHost = sessionStorage.getItem('isHost') === 'true';
      const playerTeam = sessionStorage.getItem('playerTeam') as 'red' | 'blue' | null;

      if (matchId) {
        setOnlineMatchId(matchId);
        setIsConnecting(true);

        // Connect to the match
        if (isHost) {
          onlineGame.createMatch().then(success => {
            setIsConnecting(false);
            if (!success) {
              alert('Failed to create match');
              router.push('/lobby');
            }
          });
        } else {
          onlineGame.joinMatch(matchId).then(success => {
            setIsConnecting(false);
            if (!success) {
              alert('Failed to join match');
              router.push('/lobby');
            } else if (playerTeam) {
              setCurrentTeam(playerTeam);
            }
          });
        }
      } else {
        // No match ID, redirect to lobby
        router.push('/lobby');
      }
    } else {
      // Local mode - Initialize towers in GameEngine
      Object.values(TOWER).forEach(tower => {
        gameEngine.addTower(tower.id, tower.type as 'king' | 'princess', tower.team as 'red' | 'blue', tower.row, tower.col);
      });
    }

    return () => {
      if (isOnlineMode) {
        onlineGame.disconnect();
      } else {
        // Clean up towers on component destroy
        Object.values(TOWER).forEach(tower => {
          gameEngine.removeTower(tower.id);
        });
      }
    };
  }, [isOnlineMode]);

  // Use appropriate game based on mode
  const game = isOnlineMode ? onlineGame : localGame;
  const troops = game.troops;
  const gameEngineTowers = isOnlineMode ? game.towers : localGame.towers;
  const spawnTroop = isOnlineMode
    ? (type: TroopType, team: 'red' | 'blue', row: number, col: number) => {
        // In online mode, only allow spawning for player's team
        if (team === onlineGame.playerTeam) {
          onlineGame.spawnTroop(type, team, row, col);
        }
      }
    : localGame.spawnTroop;
  const startGame = isOnlineMode ? () => {} : localGame.startGame; // Online games start automatically
  const pauseGame = isOnlineMode ? onlineGame.pauseGame : localGame.pauseGame;
  const resumeGame = isOnlineMode ? onlineGame.resumeGame : localGame.resumeGame;
  const stopGame = isOnlineMode ? onlineGame.disconnect : localGame.stopGame;
  const resetGame = isOnlineMode ? () => router.push('/lobby') : localGame.resetGame;
  const isGameRunning = isOnlineMode
    ? onlineGame.gameStatus === GameStatus.IN_PROGRESS
    : localGame.isGameRunning;
  const isGamePaused = isOnlineMode
    ? onlineGame.gameStatus === GameStatus.PAUSED
    : localGame.isGamePaused;
  const gameEnded = isOnlineMode ? onlineGame.gameEnded : localGame.gameEnded;
  const winner = isOnlineMode ? onlineGame.winner : localGame.winner;

  // Fetch game state for local mode only
  React.useEffect(() => {
    if (!isOnlineMode && gameId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/game/${gameId}/state`, { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          if (!data || data.error) return;
          setGameState(data);
        } catch (error) {
          console.error("Failed to fetch game state:", error);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [gameId, isOnlineMode]);

  // Sync currentTeam with player's actual team in online mode
  React.useEffect(() => {
    if (isOnlineMode && onlineGame.playerTeam) {
      setCurrentTeam(onlineGame.playerTeam);
    }
  }, [isOnlineMode, onlineGame.playerTeam]);

  const handleCardDragStart = (troopType: TroopType) => {
    // In online mode, always use the player's actual team
    const team = isOnlineMode && onlineGame.playerTeam ? onlineGame.playerTeam : currentTeam;
    setDraggedCard({ troopType, team });
  };
  const handleCardDragEnd = () => setDraggedCard(null);
  
  const handleCellDrop = async (row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCard) return;

    if (isOnlineMode) {
      // Online mode: Use onlineGame to spawn troops
      if (onlineGame.playerTeam && draggedCard.team === onlineGame.playerTeam) {
        onlineGame.playCard(draggedCard.troopType, row, col);
        setDraggedCard(null);
      } else {
        console.warn("Cannot spawn troops for enemy team");
      }
    } else if (gameId) {
      // Local mode: Use API endpoint
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

  const normalizeType = (s: any): TroopType | null => {
    const u = String(s || "").toLowerCase();
    if (u === "giant") return TroopType.GIANT;
    if (u === "babydragon" || u === "baby_dragon") return TroopType.BABY_DRAGON;
    if (u === "minipekka" || u === "mini_pekka") return TroopType.MINI_PEKKA;
    if (u === "valkyrie") return TroopType.VALKYRIE;
    console.warn("Unknown troop.type from API:", s);
    return null;
  };

  const FALLBACK_WALK: Record<TroopType, {player: string; opponent: string}> = {
    [TroopType.GIANT]: { player: "/images/troops/giant/Giant_walk_player.gif", opponent: "/images/troops/giant/Giant_walk_opponent.gif" },
    [TroopType.BABY_DRAGON]: { player: "/images/troops/babydragon/BabyDragon_walk_player.gif", opponent: "/images/troops/babydragon/BabyDragon_walk_opponent.gif" },
    [TroopType.MINI_PEKKA]: { player: "/images/troops/minipekka/MiniPekka_walk_player.gif", opponent: "/images/troops/minipekka/MiniPekka_walk_opponent.gif" },
    [TroopType.VALKYRIE]: { player: "/images/troops/valkyrie/Valkyrie_walk_player.gif", opponent: "/images/troops/valkyrie/Valkyrie_walk_opponent.gif" },
  };

  const FALLBACK_FIGHT: Record<TroopType, {player: string; opponent: string}> = {
    [TroopType.GIANT]: { player: "/images/troops/giant/Giant_fight_player.gif", opponent: "/images/troops/giant/Giant_fight_opponent.gif" },
    [TroopType.BABY_DRAGON]: { player: "/images/troops/babydragon/BabyDragon_fight_player.gif", opponent: "/images/troops/babydragon/BabyDragon_fight_opponent.gif" },
    [TroopType.MINI_PEKKA]: { player: "/images/troops/minipekka/MiniPekka_fight_player.gif", opponent: "/images/troops/minipekka/MiniPekka_fight_opponent.gif" },
    [TroopType.VALKYRIE]: { player: "/images/troops/valkyrie/Valkyrie_fight_player.gif", opponent: "/images/troops/valkyrie/Valkyrie_fight_opponent.gif" },
  };

  const getTroopGifPath = (troop: any) => {
    const norm = normalizeType(troop?.type);
    if (!norm) return null;
    const gifType = troop.team === 'blue' ? 'player' : 'opponent';
    const cfg = TROOP_CONFIGS[norm];

    // Check if troop is in combat (attacking state)
    const isAttacking = troop.state === 'ATTACKING_TOWER' || troop.state === 12; // TroopState.ATTACKING_TOWER = 12

    // Select appropriate gif based on state
    const gifPaths = isAttacking ? cfg?.gifPaths?.fight : cfg?.gifPaths?.walk;
    const fallback = isAttacking ? FALLBACK_FIGHT[norm] : FALLBACK_WALK[norm];
    const fromConfig = gifPaths?.[gifType];

    return (typeof fromConfig === "string" && fromConfig.length > 0)
      ? `${fromConfig}?v=${troop.id}`
      : `${fallback[gifType]}?v=${troop.id}`;
  };

  const handleRestart = () => {
    router.push("/");
  };

  // Conditional rendering based on mode
  if (isOnlineMode) {
    if (isConnecting) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Connecting to match...</div>;
    }
    if (!onlineGame.isConnected && !isConnecting) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Connection failed. Redirecting...</div>;
    }
    // Check if game is waiting for players
    if (onlineGame.gameStatus === GameStatus.WAITING) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #1e3a8a 25%, transparent 25%), linear-gradient(-45deg, #1e3a8a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e3a8a 75%), linear-gradient(-45deg, transparent 75%, #1e3a8a 75%)",
            backgroundSize: "40px 40px",
            backgroundColor: "#1e40af", // fond bleu foncé
          }}
        >
          <div className="bg-gradient-to-b from-blue-700 to-blue-900 border-4 border-blue-400 rounded-xl shadow-2xl px-12 py-10 text-center max-w-md w-full">
            <h2 className="text-3xl font-extrabold text-yellow-400 drop-shadow mb-6">
              Waiting for Opponent...
            </h2>
    
            <p className="text-blue-200 font-semibold mb-2">
              Match ID: <span className="text-white">{onlineGame.matchId}</span>
            </p>
            <p className="text-blue-200 font-semibold mb-6">
              Players:{" "}
              <span className="text-white">{onlineGame.players.length}/2</span>
            </p>
    
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
            </div>
          </div>
        </div>
      );
    }
    
  } else {
    // Local mode checks
    if (!gameId) return null;
    if (!gameState) return <div>Loading game...</div>;
  }

  // Get game data based on mode
  const gameTroops = isOnlineMode ? troops : (gameState?.troops ?? []);
  const gameTowers = isOnlineMode
    ? Object.values(TOWER).reduce((acc, tower) => {
        const engineTower = gameEngineTowers.find(t => t.id === tower.id);
        if (engineTower) {
          acc[tower.id] = {
            health: engineTower.health,
            maxHealth: engineTower.maxHealth,
            isAlive: engineTower.isAlive,
            active: engineTower.active
          };
        }
        return acc;
      }, {} as Record<string, {health:number; maxHealth:number; isAlive?:boolean; active?:boolean}>)
    : Object.fromEntries(
        Object.entries(gameState?.towers ?? {}).map(([id, t]) => [
          id,
          { ...t, maxHealth: (t as any).max_health }
        ])
      );

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-opacity duration-1000 ${isArenaVisible ? 'opacity-100' : 'opacity-0'}`}>
      <img src="/images/backgrounds/arena_in_game.png" alt="Goal Background Blurred" className="absolute inset-0 w-full h-full object-cover blur-sm" />

      {(isOnlineMode ? gameEnded : gameState?.is_game_over) &&
       (isOnlineMode ? winner : gameState?.winner) &&
       <GameEndScreen winner={(isOnlineMode ? winner : gameState?.winner) as "red" | "blue"} onRestart={handleRestart} />}

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
                  {/* Debug overlay minimal */}
                  {gameTroops.some(t => Math.floor(t.position.row) === row && Math.floor(t.position.col) === col) && (
                    <div className="absolute inset-0 z-30 pointer-events-none ring-2 ring-green-300/60"></div>
                  )}
                  
                  {shouldShowTower && (() => {
                    const engineTower = gameTowers?.[tower!.id];
                    // Check if tower exists and is alive
                    if (!engineTower || engineTower.health <= 0 || !(engineTower as any).isAlive) {
                      return null; // Don't show destroyed towers
                    }

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
                          <TowerHealthBar
                            currentHealth={engineTower.health}
                            maxHealth={engineTower.maxHealth}
                            team={(tower as any).team}
                          />
                        </div>
                      </>
                    );
                  })()}

                  {gameTroops
                    .filter(t => {
                      const p = t?.position;
                      return p && Number.isFinite(p.row) && Number.isFinite(p.col)
                        && Math.floor(p.row) === row && Math.floor(p.col) === col;
                    })
                    .map(t => {
                      const norm = normalizeType(t.type);
                      if (!norm) return null;
                      const config = TROOP_CONFIGS[norm];
                      const gifPath = getTroopGifPath(t);
                      if (!gifPath || !config) return null;
                      const p = t.position;
                      const hp = typeof t.health === "number" ? t.health : 0;
                      const maxhp = typeof t.maxHealth === "number" && t.maxHealth > 0 ? t.maxHealth : 1;

                      return (
                        <div
                          key={t.id}
                          className="absolute z-20 w-full h-full flex items-center justify-center pointer-events-none"
                          style={{ transform: `translate(${(p.col - Math.floor(p.col)) * 100}%, ${(p.row - Math.floor(p.row)) * 100}%)` }}
                        >
                          <img
                            src={gifPath}
                            alt={`${norm} ${t.team}`}
                            className="w-12 h-12 object-contain"
                            style={{
                              transform: `scale(${
                                typeof config?.scale === 'object'
                                  ? ((t.state === 'ATTACKING_TOWER' || t.state === 12) ? (config.scale.fight ?? 1) : (config.scale.walk ?? 1))
                                  : (config?.scale ?? 1)
                              })`
                            }}
                          />
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-600 rounded">
                            <div
                              className={`h-full rounded transition-all duration-200 ${t.team === 'red' ? 'bg-red-400' : 'bg-blue-400'}`}
                              style={{ width: `${(hp / maxhp) * 100}%` }}
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
          <ClashTimer
            gameTime={isOnlineMode ? onlineGame.gameTime : undefined}
            isOnlineMode={isOnlineMode}
          />
        </div>

        {/* Debug: affichage temporaire de tous les troops */}
        {(gameState?.troops ?? []).map(t => (
          <div key={t.id} className="absolute top-0 left-0 text-white bg-black p-1 text-xs z-50">
            {t.type} {t.team} @ {t.position.row},{t.position.col}
          </div>
        ))}

        {/* Barre de cartes */}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-center items-end pb-4">
            <div className="relative w-[80%] max-w-md">
              <img src="/images/cards/more/card_box.png" alt="Card Box" className="w-full h-44 object-fill rounded-t-lg" />
              <div className="absolute inset-0 grid grid-cols-4 gap-1.5 pl-[4.5%] pr-[4%] pb-[5.5%] items-stretch">
                {/* Baby Dragon */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-yellow-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.BABY_DRAGON)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/BabyDragonCard.png" alt={`${currentTeam} Baby Dragon`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Mini PEKKA */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.MINI_PEKKA)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/MiniPEKKACard.png" alt={`${currentTeam} Mini PEKKA`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Giant */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-orange-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.GIANT)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/GiantCard.png" alt={`${currentTeam} Giant`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>

                {/* Valkyrie */}
                <div
                  className={`w-full h-full transition-all duration-200 hover:scale-105 hover:z-10 relative rounded ${
                    !isGameRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-red-400 hover:ring-opacity-80'
                  }`}
                  draggable={isGameRunning}
                  onDragStart={() => handleCardDragStart(TroopType.VALKYRIE)}
                  onDragEnd={handleCardDragEnd}
                >
                  <img src="/images/cards/more/ValkyrieCard.png" alt={`${currentTeam} Valkyrie`} className="w-full h-full object-contain drop-shadow-lg pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles du jeu */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          {/* Online Mode Indicator */}
          {isOnlineMode && (
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  onlineGame.isConnected ? 'bg-green-500' :
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-white text-sm font-semibold">
                  {onlineGame.isConnected ? 'Connected' :
                   isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              {onlineGame.playerTeam && (
                <div className="text-xs text-gray-300">
                  <p>Team: <span className={`font-bold ${
                    onlineGame.playerTeam === 'red' ? 'text-red-400' : 'text-blue-400'
                  }`}>{onlineGame.playerTeam.toUpperCase()}</span></p>
                  <p>Match: {onlineMatchId?.substring(0, 8)}</p>
                  <p>Elixir: {Math.floor(onlineGame.playerElixir)}/{10}</p>
                </div>
              )}
              <Button
                onClick={() => {
                  onlineGame.disconnect();
                  router.push('/lobby');
                }}
                variant="destructive"
                size="sm"
                className="w-full mt-2"
              >
                Leave Match
              </Button>
            </div>
          )}

          {/* Bouton pour switcher d'équipe (local mode only) */}
          {!isOnlineMode && (
          <Button
            variant="secondary"
            className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg border-2 border-white/20 ${
              currentTeam === 'red' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={switchTeam}
          >
            Team: {currentTeam === 'red' ? 'Red' : 'Blue'}
          </Button>
          )}

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
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense for Next.js
export default function Arena() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading Arena...</div>
      </div>
    }>
      <ArenaContent />
    </Suspense>
  );
}
