import { WebSocket } from 'ws';
import { PlayerState } from './shared/game';

export interface WSClient {
  id: string;
  ws: WebSocket;
  playerId: string;
  roomId?: string;
  isAlive: boolean;
  lastPing: number;
}

export interface InputQueue {
  actions: Array<{
    action: any;
    timestamp: number;
    processedTick?: number;
  }>;
}

export interface ServerConfig {
  port: number;
  wsPort: number;
  corsOrigin: string;
  maxRooms: number;
  maxPlayersPerRoom: number;
  tickRate: number;
  env: 'development' | 'production';
}

export interface RoomManager {
  rooms: Map<string, any>;
  createRoom(): string;
  joinRoom(roomId: string, playerId: string): boolean;
  leaveRoom(roomId: string, playerId: string): void;
  getRoom(roomId: string): any;
  deleteRoom(roomId: string): void;
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
  EMOTE_EVENT = 'EMOTE_EVENT',
  ERROR = 'ERROR',
  PONG = 'PONG'
}

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  data?: any;
}

export interface WSErrorMessage extends WSMessage {
  type: WSMessageType.ERROR;
  data: {
    code: string;
    message: string;
  };
}

export interface WSSnapshotMessage extends WSMessage {
  type: WSMessageType.GAME_SNAPSHOT;
  data: {
    snapshot: any;
  };
}

export interface WSEmoteMessage extends WSMessage {
  type: WSMessageType.EMOTE_EVENT;
  data: {
    playerId: string;
    team: 'red' | 'blue';
    emoteType: string;
    position?: { x: number; y: number };
  };
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