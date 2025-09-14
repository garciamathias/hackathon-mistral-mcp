// MCP Types and Interfaces for Clash Royale Game Server

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

// MCP Tool Parameters
export interface CreateGameParams {
  playerName?: string;
}

export interface JoinGameParams {
  matchId: string;
  playerName?: string;
}

export interface GetGameStatusParams {
  matchId: string;
}

export interface SpawnTroopParams {
  matchId: string;
  troopType: 'giant' | 'babyDragon' | 'miniPekka' | 'valkyrie';
  row: number;
  col: number;
}

// MCP Session Management
export interface MCPSession {
  sessionId: string;
  playerId: string;
  playerName: string;
  currentMatchId?: string;
  team?: 'red' | 'blue';
  createdAt: number;
  lastActivity: number;
}

// MCP Response Types
export interface CreateGameResponse {
  success: boolean;
  matchId: string;
  team: 'red' | 'blue';
  wsUrl: string;
  message: string;
  sessionId?: string; // Session ID to use for subsequent calls
  playerId?: string;  // Player ID for reference
}

export interface JoinGameResponse {
  success: boolean;
  matchId: string;
  team: 'red' | 'blue';
  wsUrl: string;
  playerCount: number;
  message: string;
  sessionId?: string; // Session ID to use for subsequent calls
  playerId?: string;  // Player ID for reference
}

export interface GameStatusResponse {
  matchId: string;
  status: string;
  gameTime: number;
  players: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    elixir: number;
    crowns: number;
  }>;
  troops: Array<{
    id: string;
    type: string;
    team: 'red' | 'blue';
    position: { row: number; col: number };
    health: number;
    maxHealth: number;
    state: string;
  }>;
  towers: Array<{
    id: string;
    type: 'king' | 'princess';
    team: 'red' | 'blue';
    health: number;
    maxHealth: number;
    position: { row: number; col: number };
  }>;
}

export interface SpawnTroopResponse {
  success: boolean;
  troopId?: string;
  message: string;
  elixirRemaining?: number;
}