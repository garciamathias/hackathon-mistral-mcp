// Types shared with backend server

export interface Position {
  row: number;
  col: number;
}

export enum TroopState {
  SPAWNING = 'SPAWNING',
  MOVING_TO_BRIDGE = 'MOVING_TO_BRIDGE',
  TARGETING_TOWER = 'TARGETING_TOWER',
  ATTACKING_TOWER = 'ATTACKING_TOWER',
  DEAD = 'DEAD'
}

export interface TroopData {
  id: string;
  type: string;
  team: 'red' | 'blue';
  position: Position;
  targetPosition: Position;
  state: TroopState;
  health: number;
  maxHealth: number;
  speed: number;
  isAlive: boolean;
  bridgeTarget?: Position;
  towerTarget?: string;
  isInCombat: boolean;
  attackDamage: number;
  attackSpeed: number;
  lastAttackTime: number;
  focusOnBuildings: boolean;
  flying: boolean;
  row: number;
  col: number;
  spawnTime: number;
  lastUpdateTime: number;
}

export interface TowerData {
  id: string;
  type: 'king' | 'princess';
  team: 'red' | 'blue';
  position: Position;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  active: boolean;
  damage: number;
  attackSpeed: number;
  range: number;
  lastAttackTime: number;
}

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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export interface CreateMatchResponse {
  matchId: string;
  joinToken: string;
  wsUrl: string;
}

export interface JoinMatchResponse {
  matchId: string;
  team: 'red' | 'blue';
  wsUrl: string;
  playerState: PlayerState;
}

export interface MatchInfo {
  id: string;
  playerCount: number;
  maxPlayers: number;
  status: GameStatus;
  createdAt: number;
  startedAt?: number;
  players: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    isConnected: boolean;
  }>;
}

// WebSocket message types
export enum WSMessageType {
  // Client -> Server
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  PLAY_CARD = 'PLAY_CARD',
  GAME_ACTION = 'GAME_ACTION',
  PING = 'PING',

  // Server -> Client
  ROOM_JOINED = 'ROOM_JOINED',
  ROOM_LEFT = 'ROOM_LEFT',
  GAME_SNAPSHOT = 'GAME_SNAPSHOT',
  GAME_EVENT = 'GAME_EVENT',
  ERROR = 'ERROR',
  PONG = 'PONG'
}

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  data?: any;
}

export interface PlayCardData {
  troopType: string;
  position: Position;
}