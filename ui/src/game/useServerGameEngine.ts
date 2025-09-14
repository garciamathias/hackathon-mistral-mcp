"use client";

import { useState, useEffect, useCallback } from "react";
import { BaseTroop, TroopType } from "./types/Troop";
import { Tower } from "./types/Tower";
import { serverEngine } from "./ServerSyncEngine";

export interface GameHookReturn {
  troops: BaseTroop[];
  giants: any[];
  babyDragons: any[];
  miniPekkas: any[];
  valkyries: any[];
  towers: Tower[];
  gameEnded: boolean;
  winner: "red" | "blue" | null;
  spawnTroop: (type: TroopType, team: "red" | "blue", row: number, col: number) => void;
  spawnGiantAt: (team: "red" | "blue", row: number, col: number) => void;
  spawnBabyDragon: (team: "red" | "blue", row: number, col: number) => void;
  spawnMiniPekka: (team: "red" | "blue", row: number, col: number) => void;
  spawnValkyrie: (team: "red" | "blue", row: number, col: number) => void;
  gameStats: {
    totalTroops: number;
    livingTroops: number;
    redTroops: number;
    blueTroops: number;
    totalGiants: number;
    livingGiants: number;
    redGiants: number;
    blueGiants: number;
    totalBabyDragons: number;
    livingBabyDragons: number;
    redBabyDragons: number;
    blueBabyDragons: number;
    totalMiniPekkas: number;
    livingMiniPekkas: number;
    redMiniPekkas: number;
    blueMiniPekkas: number;
    totalValkyries: number;
    livingValkyries: number;
    redValkyries: number;
    blueValkyries: number;
    gameTime: number;
    isRunning: boolean;
    isPaused: boolean;
  };
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  resetGame: () => void;
  isGameRunning: boolean;
  isGamePaused: boolean;
  connectFlaggedCells: (fc: Set<string>) => void;
}

export const useServerGameEngine = (): GameHookReturn => {
  const [troops, setTroops] = useState<BaseTroop[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [gameStats, setGameStats] = useState(serverEngine.getGameStats());
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<"red" | "blue" | null>(null);

  useEffect(() => {
    let mounted = true;

    // ✅ Restaurer le game_id depuis localStorage au démarrage
    const savedGameId = serverEngine.restoreFromStorage();
    if (savedGameId && mounted) {
      console.log("🔄 Restored game from storage:", savedGameId);
      serverEngine.start();
    }

    // ✅ Brancher les callbacks
    serverEngine.setOnUpdate((updatedTroops) => {
      setTroops([...updatedTroops]);
      setTowers([...serverEngine.getAllTowers()]);
      setGameStats(serverEngine.getGameStats());
    });

    serverEngine.setOnGameEnd((w) => {
      setGameEnded(true);
      setWinner(w);
    });

    return () => {
      mounted = false;
      serverEngine.stop();
    };
  }, []);

  const spawnTroop = useCallback((type: TroopType, team: "red" | "blue", row: number, col: number) => {
    serverEngine.spawnTroop(type, team, row, col);
  }, []);

  const spawnGiantAt = useCallback((team: "red" | "blue", row: number, col: number) => {
    serverEngine.spawnTroop(TroopType.GIANT, team, row, col);
  }, []);

  const spawnBabyDragon = useCallback((team: "red" | "blue", row: number, col: number) => {
    serverEngine.spawnTroop(TroopType.BABY_DRAGON, team, row, col);
  }, []);

  const spawnMiniPekka = useCallback((team: "red" | "blue", row: number, col: number) => {
    serverEngine.spawnTroop(TroopType.MINI_PEKKA, team, row, col);
  }, []);

  const spawnValkyrie = useCallback((team: "red" | "blue", row: number, col: number) => {
    serverEngine.spawnTroop(TroopType.VALKYRIE, team, row, col);
  }, []);

  const startGame = useCallback(() => {
    serverEngine.start();
    setGameStats(serverEngine.getGameStats());
  }, []);

  const pauseGame = useCallback(() => {
    serverEngine.pause();
    setGameStats(serverEngine.getGameStats());
  }, []);

  const resumeGame = useCallback(() => {
    serverEngine.resume();
    setGameStats(serverEngine.getGameStats());
  }, []);

  const stopGame = useCallback(() => {
    serverEngine.stop();
    setGameStats(serverEngine.getGameStats());
  }, []);

  const resetGame = useCallback(() => {
    serverEngine.reset();
    setGameEnded(false);
    setWinner(null);
  }, []);

  const connectFlaggedCells = useCallback((fc: Set<string>) => {
    serverEngine.connectFlaggedCells(fc);
  }, []);

  return {
    troops,
    giants: troops.filter(t => t.type === TroopType.GIANT) as any[],
    babyDragons: troops.filter(t => t.type === TroopType.BABY_DRAGON) as any[],
    miniPekkas: troops.filter(t => t.type === TroopType.MINI_PEKKA) as any[],
    valkyries: troops.filter(t => t.type === TroopType.VALKYRIE) as any[],
    towers,
    gameEnded,
    winner,
    spawnTroop,
    spawnGiantAt,
    spawnBabyDragon,
    spawnMiniPekka,
    spawnValkyrie,
    gameStats,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    resetGame,
    isGameRunning: gameStats.isRunning,
    isGamePaused: gameStats.isPaused,
    connectFlaggedCells,
  };
};
