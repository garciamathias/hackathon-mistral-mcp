import { useState, useEffect, useCallback } from 'react';
import { gameEngine } from './GameEngine';
import { Giant } from './Giant';

export interface GameHookReturn {
  giants: Giant[];
  gameStats: any;
  spawnGiantAt: (team: 'red' | 'blue', row: number, col: number) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  isGameRunning: boolean;
  isGamePaused: boolean;
}

export const useGameEngine = (towers?: any[], flaggedCells?: Set<string>): GameHookReturn => {
  const [giants, setGiants] = useState<Giant[]>([]);
  const [gameStats, setGameStats] = useState(gameEngine.getGameStats());

  // Mettre à jour les géants quand le moteur les modifie
  const handleGiantsUpdate = useCallback((updatedGiants: Giant[]) => {
    setGiants([...updatedGiants]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  // Configurer le callback du moteur de jeu
  useEffect(() => {
    gameEngine.setOnUpdateCallback(handleGiantsUpdate);
    
    return () => {
      gameEngine.setOnUpdateCallback(() => {});
    };
  }, [handleGiantsUpdate]);

  // Connecter les tours au moteur de jeu
  useEffect(() => {
    if (towers) {
      gameEngine.connectTowers(towers);
    }
  }, [towers]);

  // Connecter les flagged cells au moteur de jeu
  useEffect(() => {
    if (flaggedCells) {
      gameEngine.connectFlaggedCells(flaggedCells);
    }
  }, [flaggedCells]);

  // Fonctions de contrôle du jeu
  const spawnGiant = useCallback((team: 'red' | 'blue') => {
    gameEngine.spawnGiant(team);
  }, []);

  const spawnGiantAt = useCallback((team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnGiantAt(team, row, col);
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
    setGiants([]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      gameEngine.stop();
    };
  }, []);

  return {
    giants,
    gameStats,
    spawnGiantAt,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    isGameRunning: gameStats.isRunning,
    isGamePaused: gameStats.isPaused
  };
};
