import { useState, useEffect, useCallback, useRef } from 'react';
import { GameClient } from '@/services/gameClient';
import { ConnectionStatus } from '@/services/websocket';
import {
  GameSnapshot,
  GameStatus,
  TroopData,
  TowerData,
  PlayerState,
  EmoteEventData
} from '@/types/backend';
import { BaseTroop, TroopType } from '@/game/types/Troop';
import { Tower } from '@/game/types/Tower';

export interface OnlineGameHookReturn {
  // Connection
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  matchId: string | null;

  // Game state
  troops: BaseTroop[];
  towers: Tower[];
  players: PlayerState[];

  // Player state
  playerTeam: 'red' | 'blue' | null;
  playerElixir: number;
  playerState: PlayerState | null;

  // Game status
  gameStatus: GameStatus | null;
  gameTime: number;
  gameEnded: boolean;
  winner: 'red' | 'blue' | 'draw' | null;

  // Emotes
  currentEmote: EmoteEventData | null;

  // Actions
  createMatch: () => Promise<boolean>;
  joinMatch: (matchId: string) => Promise<boolean>;
  spawnTroop: (type: TroopType, team: 'red' | 'blue', row: number, col: number) => void;
  playCard: (troopType: string, row: number, col: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  surrender: () => void;
  disconnect: () => void;

  // Stats
  gameStats: {
    totalTroops: number;
    livingTroops: number;
    redTroops: number;
    blueTroops: number;
    gameTime: number;
    isRunning: boolean;
    isPaused: boolean;
  };
}

export const useOnlineGame = (): OnlineGameHookReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<'red' | 'blue' | 'draw' | null>(null);
  const [currentEmote, setCurrentEmote] = useState<EmoteEventData | null>(null);
  const gameClientRef = useRef<GameClient | null>(null);

  // Initialize game client
  useEffect(() => {
    if (!gameClientRef.current) {
      gameClientRef.current = new GameClient({
        onSnapshot: (newSnapshot) => {
          setSnapshot(newSnapshot);
        },
        onStatusChange: (status) => {
          setConnectionStatus(status);
        },
        onGameEnd: (gameWinner) => {
          setGameEnded(true);
          setWinner(gameWinner);
        },
        onEmote: (emoteData) => {
          setCurrentEmote(emoteData);
          // Auto clear after 3 seconds
          setTimeout(() => setCurrentEmote(null), 3000);
        },
        onError: (error) => {
          console.error('Game client error:', error);
        }
      });
    }

    return () => {
      gameClientRef.current?.destroy();
      gameClientRef.current = null;
    };
  }, []);

  // Match management
  const createMatch = useCallback(async (): Promise<boolean> => {
    if (!gameClientRef.current) return false;
    setGameEnded(false);
    setWinner(null);
    return await gameClientRef.current.createMatch();
  }, []);

  const joinMatch = useCallback(async (matchId: string): Promise<boolean> => {
    if (!gameClientRef.current) return false;
    setGameEnded(false);
    setWinner(null);
    return await gameClientRef.current.joinMatch(matchId);
  }, []);

  // Game actions
  const spawnTroop = useCallback((type: TroopType, team: 'red' | 'blue', row: number, col: number) => {
    if (!gameClientRef.current) return;

    // Only allow spawning for player's team
    const playerTeam = gameClientRef.current.getPlayerTeam();
    if (playerTeam !== team) {
      console.warn('Cannot spawn troops for enemy team');
      return;
    }

    gameClientRef.current.playCard(type, row, col);
  }, []);

  const playCard = useCallback((troopType: string, row: number, col: number) => {
    if (!gameClientRef.current) return;
    gameClientRef.current.playCard(troopType, row, col);
  }, []);

  const pauseGame = useCallback(() => {
    gameClientRef.current?.pauseGame();
  }, []);

  const resumeGame = useCallback(() => {
    gameClientRef.current?.resumeGame();
  }, []);

  const surrender = useCallback(() => {
    gameClientRef.current?.surrender();
  }, []);

  const disconnect = useCallback(() => {
    gameClientRef.current?.disconnect();
    setSnapshot(null);
    setConnectionStatus('disconnected');
  }, []);

  // Convert backend data to frontend format
  const convertTroops = (troopData: TroopData[]): BaseTroop[] => {
    return troopData.map(troop => ({
      id: troop.id,
      type: troop.type as TroopType,
      team: troop.team,
      position: troop.position,
      targetPosition: troop.targetPosition,
      state: troop.state as any,
      health: troop.health,
      maxHealth: troop.maxHealth,
      speed: troop.speed,
      isAlive: troop.isAlive,
      bridgeTarget: troop.bridgeTarget,
      towerTarget: troop.towerTarget,
      isInCombat: troop.isInCombat,
      attackDamage: troop.attackDamage,
      attackSpeed: troop.attackSpeed,
      lastAttackTime: troop.lastAttackTime,
      focusOnBuildings: troop.focusOnBuildings,
      flying: troop.flying,
      row: troop.row,
      col: troop.col
    }));
  };

  const convertTowers = (towerData: TowerData[]): Tower[] => {
    return towerData.map<Tower>(t => ({
      id: t.id,
      type: t.type,
      team: t.team,
      row: t.position.row,
      col: t.position.col,
      health: t.health,
      maxHealth: t.maxHealth,
      isAlive: t.isAlive,
      active: t.active,
      position: t.position,
      // Champs requis par le type Tower côté moteur
      lastAttackTime: t.lastAttackTime ?? 0,
      isAttacking: false,
      canAttack: true,
      // Optionnels si présents dans votre type Tower (sans impact si inconnus)
      damage: (t as any).damage,
      attackSpeed: (t as any).attackSpeed,
      range: (t as any).range,
    }));
  };

  // Calculate game stats
  const gameStats = {
    totalTroops: snapshot?.troops.length || 0,
    livingTroops: snapshot?.troops.filter(t => t.isAlive).length || 0,
    redTroops: snapshot?.troops.filter(t => t.team === 'red' && t.isAlive).length || 0,
    blueTroops: snapshot?.troops.filter(t => t.team === 'blue' && t.isAlive).length || 0,
    gameTime: snapshot?.gameTime || 0,
    isRunning: snapshot?.status === GameStatus.IN_PROGRESS,
    isPaused: snapshot?.status === GameStatus.PAUSED
  };

  return {
    // Connection
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    matchId: gameClientRef.current?.getMatchId() || null,

    // Game state
    troops: snapshot ? convertTroops(snapshot.troops) : [],
    towers: snapshot ? convertTowers(snapshot.towers) : [],
    players: snapshot?.players || [],

    // Player state
    playerTeam: gameClientRef.current?.getPlayerTeam() || null,
    playerElixir: gameClientRef.current?.getPlayerElixir() || 0,
    playerState: gameClientRef.current?.getPlayerState() || null,

    // Game status
    gameStatus: snapshot?.status || null,
    gameTime: snapshot?.gameTime || 0,
    gameEnded,
    winner,

    // Emotes
    currentEmote,

    // Actions
    createMatch,
    joinMatch,
    spawnTroop,
    playCard,
    pauseGame,
    resumeGame,
    surrender,
    disconnect,

    // Stats
    gameStats
  };
};