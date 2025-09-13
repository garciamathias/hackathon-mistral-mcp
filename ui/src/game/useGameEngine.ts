import { useState, useEffect, useCallback } from 'react';
import { gameEngine } from './GameEngine';
import { Giant } from './troops/Giant';
import { BabyDragon } from './troops/BabyDragon';
import { MiniPekka } from './troops/MiniPekka';
import { Valkyrie } from './troops/Valkyrie';
import { BaseTroop, TroopType } from './types/Troop';
import { Tower } from './types/Tower';

export interface GameHookReturn {
  // Troupes génériques
  troops: BaseTroop[];
  // Troupes par type (pour compatibilité)
  giants: Giant[];
  babyDragons: BabyDragon[];
  miniPekkas: MiniPekka[];
  valkyries: Valkyrie[];
  // Tours avec leur santé mise à jour
  towers: Tower[];
  // État de fin de partie
  gameEnded: boolean;
  winner: 'red' | 'blue' | null;
  // Méthodes génériques
  spawnTroop: (type: TroopType, team: 'red' | 'blue', row: number, col: number) => void;
  // Méthodes spécifiques (pour compatibilité)
  spawnGiantAt: (team: 'red' | 'blue', row: number, col: number) => void;
  spawnBabyDragon: (team: 'red' | 'blue', row: number, col: number) => void;
  spawnMiniPekka: (team: 'red' | 'blue', row: number, col: number) => void;
  spawnValkyrie: (team: 'red' | 'blue', row: number, col: number) => void;
  // Contrôles du jeu
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
}

export const useGameEngine = (towers?: Tower[], flaggedCells?: Set<string>): GameHookReturn => {
  const [troops, setTroops] = useState<BaseTroop[]>([]);
  const [giants, setGiants] = useState<Giant[]>([]);
  const [babyDragons, setBabyDragons] = useState<BabyDragon[]>([]);
  const [miniPekkas, setMiniPekkas] = useState<MiniPekka[]>([]);
  const [valkyries, setValkyries] = useState<Valkyrie[]>([]);
  const [gameTowers, setGameTowers] = useState<Tower[]>([]);
  const [gameStats, setGameStats] = useState(gameEngine.getGameStats());
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winner, setWinner] = useState<'red' | 'blue' | null>(null);

  // Mettre à jour les troupes et tours quand le moteur les modifie
  const handleGameUpdate = useCallback((updatedTroops: BaseTroop[]) => {
    setTroops([...updatedTroops]);
    // Séparer par type pour compatibilité
    setGiants([...updatedTroops.filter(t => t.type === TroopType.GIANT)] as unknown as Giant[]);
    setBabyDragons([...updatedTroops.filter(t => t.type === TroopType.BABY_DRAGON)] as unknown as BabyDragon[]);
    setMiniPekkas([...updatedTroops.filter(t => t.type === TroopType.MINI_PEKKA)] as unknown as MiniPekka[]);
    setValkyries([...updatedTroops.filter(t => t.type === TroopType.VALKYRIE)] as unknown as Valkyrie[]);
    // Mettre à jour les tours avec leur santé actuelle
    setGameTowers([...gameEngine.getAllTowers()]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  // Gérer la fin de partie
  const handleGameEnd = useCallback((gameWinner: 'red' | 'blue') => {
    setGameEnded(true);
    setWinner(gameWinner);
  }, []);

  // Configurer le callback du moteur de jeu
  useEffect(() => {
    gameEngine.setOnUpdateCallback(handleGameUpdate);
    gameEngine.setOnGameEndCallback(handleGameEnd);
    
    return () => {
      gameEngine.setOnUpdateCallback(() => {});
      gameEngine.setOnGameEndCallback(() => {});
    };
  }, [handleGameUpdate, handleGameEnd]);

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

  const spawnMiniPekka = useCallback((team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnMiniPekka(team, row, col);
  }, []);

  const spawnValkyrie = useCallback((team: 'red' | 'blue', row: number, col: number) => {
    gameEngine.spawnValkyrie(team, row, col);
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
    setMiniPekkas([]);
    setValkyries([]);
    setGameStats(gameEngine.getGameStats());
  }, []);

  const resetGame = useCallback(() => {
    gameEngine.reset();
    setTroops([]);
    setGiants([]);
    setBabyDragons([]);
    setMiniPekkas([]);
    setValkyries([]);
    setGameStats(gameEngine.getGameStats());
    setGameEnded(false);
    setWinner(null);
    
    // Réinitialiser les tours à leur santé maximale
    if (towers) {
      towers.forEach(tower => {
        gameEngine.addTower(tower.id, tower.type, tower.team, tower.row, tower.col);
      });
    }
  }, [towers]);

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
    miniPekkas,
    valkyries,
    // Tours avec leur santé mise à jour
    towers: gameTowers,
    // État de fin de partie
    gameEnded,
    winner,
    // Méthodes génériques
    spawnTroop,
    // Méthodes spécifiques (pour compatibilité)
    spawnGiantAt,
    spawnBabyDragon,
    spawnMiniPekka,
    spawnValkyrie,
    // Contrôles du jeu
    gameStats,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    resetGame,
    isGameRunning: gameStats.isRunning,
    isGamePaused: gameStats.isPaused
  };
};
