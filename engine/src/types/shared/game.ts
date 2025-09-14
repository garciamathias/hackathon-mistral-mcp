import { TroopData } from './troop';
import { TowerData } from './tower';

export enum GameStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED'
}

export interface PlayerState {
  id: string;
  name: string;
  team: 'red' | 'blue';
  isConnected: boolean;
  elixir: number;
  maxElixir: number;
  elixirRegenRate: number;
  crowns: number;
  lastActionTime: number;
}

export interface GameSnapshot {
  timestamp: number;
  tick: number;
  status: GameStatus;
  gameTime: number;
  troops: TroopData[];
  towers: TowerData[];
  players: PlayerState[];
  winner?: 'red' | 'blue' | 'draw';
  endReason?: string;
}

export interface GameRoom {
  id: string;
  createdAt: number;
  status: GameStatus;
  players: Map<string, PlayerState>;
  maxPlayers: number;
  currentTick: number;
  gameStartTime: number;
  gameEndTime?: number;
}

export interface GameAction {
  type: 'PLAY_CARD' | 'PAUSE' | 'RESUME' | 'SURRENDER';
  playerId: string;
  timestamp: number;
  data?: any;
}

export interface PlayCardAction extends GameAction {
  type: 'PLAY_CARD';
  data: {
    troopType: string;
    position: {
      row: number;
      col: number;
    };
  };
}

export interface GameConfig {
  tickRate: number; // Hz (ticks per second)
  tickInterval: number; // ms
  maxGameDuration: number; // seconds
  overtimeDuration: number; // seconds
  suddenDeathDuration: number; // seconds
  initialElixir: number;
  maxElixir: number;
  elixirRegenRate: number; // elixir per second
  gridRows: number;
  gridCols: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  tickRate: 10,
  tickInterval: 100,
  maxGameDuration: 180, // 3 minutes
  overtimeDuration: 60, // 1 minute
  suddenDeathDuration: 180, // 3 minutes
  initialElixir: 5,
  maxElixir: 10,
  elixirRegenRate: 2.8 / 2.8, // 1 elixir per 2.8 seconds
  gridRows: 34,
  gridCols: 18
};