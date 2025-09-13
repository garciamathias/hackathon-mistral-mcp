import { useState, useEffect, useCallback } from 'react';
import { gameEngine } from './GameEngine';
import { Giant } from './troops/Giant';
import { BabyDragon } from './troops/BabyDragon';
import { BaseTroop, TroopType } from './types/Troop';
import { Tower } from './types/Tower';

export interface GameHookReturn {
  // Troupes génériques
  troops: BaseTroop[];
  // Troupes par type (pour compatibilité)
  giants: Giant[];
  babyDragons: BabyDragon[];
  // Méthodes génériques
  spawnTroop: (type: TroopType, team: 'red' | 'blue', row: number, col: number) => void;
  // Méthodes spécifiques (pour compatibilité)
  spawnGiantAt: (team: 'red' | 'blue', row: number, col: number) => void;
  spawnBabyDragon: (team: 'red' | 'blue', row: number, col: number) => void;
  // Contrôles du jeu
  gameStats: {
    totalTroops: number;
    livingTroops: number;
    redTroops: number;
    blueTroops: number;
    gameTime: number;
    isRunning: boolean;
    isPaused: boolean;
  };
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  isGameRunning: boolean;
  isGamePaused: boolean;
}

export const useGameEngine = (towers?: Tower[], flaggedCells?: Set<string>): GameHookReturn => {
  const [troops, setTroops] = useState<BaseTroop[]>([]);
  const [giants, setGiants] = useState<Giant[]>([]);
  const [babyDragons, setBabyDragons] = useState<BabyDragon[]>([]);
  const [gameStats, setGameStats] = useState(gameEngine.getGameStats());

  // Mettre à jour les troupes quand le moteur les modifie
  const handleTroopsUpdate = useCallback((updatedTroops: BaseTroop[]) => {
    setTroops([...updatedTroops]);
    // Séparer par type pour compatibilité
    setGiants([...updatedTroops.filter(t => t.type === TroopType.GIANT)] as unknown as Giant[]);
    setBabyDragons([...updatedTroops.filter(t => t.type === TroopType.BABY_DRAGON)] as unknown as BabyDragon[]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  // Configurer le callback du moteur de jeu
  useEffect(() => {
    gameEngine.setOnUpdateCallback(handleTroopsUpdate);
    
    return () => {
      gameEngine.setOnUpdateCallback(() => {});
    };
  }, [handleTroopsUpdate]);

  // Connecter les flagged cells au moteur de jeu
  useEffect(() => {
    if (flaggedCells) {
      gameEngine.connectFlaggedCells(flaggedCells);
    }
  }, [flaggedCells]);

  // Fonctions de contrôle du jeu
  const spawnTroop = useCallback((type: TroopType, team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnTroop(type, team, row, col);
  }, []);

  const spawnGiantAt = useCallback((team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnGiantAt(team, row, col);
  }, []);

  const spawnBabyDragon = useCallback((team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnBabyDragon(team, row, col);
  }, []);

  const startGame = useCallback(() => {
    gameEngine.start();
    setGameStats(gameEngine.getGameStats());
  }, []);

  const pauseGame = useCallback(() => {
    gameEngine.pause();
    setGameStats(gameEngine.getGameStats());
  }, []);

  const resumeGame = useCallback(() => {
    gameEngine.resume();
    setGameStats(gameEngine.getGameStats());
  }, []);

  const stopGame = useCallback(() => {
    gameEngine.stop();
    setTroops([]);
    setGiants([]);
    setBabyDragons([]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      gameEngine.stop();
    };
  }, []);

  return {
    // Troupes génériques
    troops,
    // Troupes par type (pour compatibilité)
    giants,
    babyDragons,
    // Méthodes génériques
    spawnTroop,
    // Méthodes spécifiques (pour compatibilité)
    spawnGiantAt,
    spawnBabyDragon,
    // Contrôles du jeu
    gameStats,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    isGameRunning: gameStats.isRunning,
    isGamePaused: gameStats.isPaused
  };
};
