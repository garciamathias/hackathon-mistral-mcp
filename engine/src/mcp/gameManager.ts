import { v4 as uuidv4 } from 'uuid';
import { WSManager } from '@websocket/WSManager';
import { GameRoom } from '@core/GameRoom';
import { TroopType } from '@shared/troop';
import {
  MCPSession,
  CreateGameResponse,
  JoinGameResponse,
  GameStatusResponse,
  SpawnTroopResponse
} from './types';

export class MCPGameManager {
  private sessions: Map<string, MCPSession> = new Map();
  private wsManager: WSManager;

  constructor(wsManager: WSManager) {
    this.wsManager = wsManager;
  }

  private getOrCreateSession(sessionId?: string): MCPSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = Date.now();
      return session;
    }

    const newSession: MCPSession = {
      sessionId: uuidv4(),
      playerId: `mcp_${uuidv4().substring(0, 8)}`,
      playerName: `Claude_${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.sessions.set(newSession.sessionId, newSession);
    return newSession;
  }

  public createGame(playerName?: string, sessionId?: string): CreateGameResponse {
    const session = this.getOrCreateSession(sessionId);

    if (playerName) {
      session.playerName = playerName;
    }

    // Create a new game room
    const room = this.wsManager.createRoom();
    const playerState = room.addPlayer(session.playerId, session.playerName);

    if (!playerState) {
      this.wsManager.removeRoom(room.id);
      return {
        success: false,
        matchId: '',
        team: 'red',
        wsUrl: '',
        message: 'Failed to create game room'
      };
    }

    session.currentMatchId = room.id;
    session.team = playerState.team;

    return {
      success: true,
      matchId: room.id,
      team: playerState.team,
      wsUrl: `ws://localhost:3001?roomId=${room.id}&playerId=${session.playerId}`,
      message: `Game created! You are on team ${playerState.team}. Match ID: ${room.id}`
    };
  }

  public joinGame(matchId: string, playerName?: string, sessionId?: string): JoinGameResponse {
    const session = this.getOrCreateSession(sessionId);

    if (playerName) {
      session.playerName = playerName;
    }

    const room = this.wsManager.getRoom(matchId);

    if (!room) {
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: 0,
        message: 'Game not found'
      };
    }

    if (room.isFull()) {
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: room.getPlayerCount(),
        message: 'Game is full'
      };
    }

    const playerState = room.addPlayer(session.playerId, session.playerName);

    if (!playerState) {
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: room.getPlayerCount(),
        message: 'Failed to join game'
      };
    }

    session.currentMatchId = matchId;
    session.team = playerState.team;

    // Start game if room is now full
    if (room.isFull()) {
      room.startGame();
    }

    return {
      success: true,
      matchId,
      team: playerState.team,
      wsUrl: `ws://localhost:3001?roomId=${matchId}&playerId=${session.playerId}`,
      playerCount: room.getPlayerCount(),
      message: `Joined game! You are on team ${playerState.team}. ${room.isFull() ? 'Game starting!' : 'Waiting for another player...'}`
    };
  }

  public getGameStatus(matchId: string): GameStatusResponse | null {
    const room = this.wsManager.getRoom(matchId);

    if (!room) {
      return null;
    }

    const snapshot = room.getSnapshot();

    return {
      matchId,
      status: snapshot.status,
      gameTime: snapshot.gameTime,
      players: snapshot.players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        elixir: Math.floor(p.elixir),
        crowns: p.crowns
      })),
      troops: snapshot.troops.map(t => ({
        id: t.id,
        type: t.type,
        team: t.team,
        position: { row: t.row, col: t.col },
        health: Math.round(t.health),
        maxHealth: t.maxHealth,
        state: t.state
      })),
      towers: snapshot.towers.map(t => ({
        id: t.id,
        type: t.type as 'king' | 'princess',
        team: t.team,
        health: Math.round(t.health),
        maxHealth: t.maxHealth,
        position: t.position
      }))
    };
  }

  public spawnTroop(
    matchId: string,
    troopType: string,
    row: number,
    col: number,
    sessionId?: string
  ): SpawnTroopResponse {
    const room = this.wsManager.getRoom(matchId);

    if (!room) {
      return {
        success: false,
        message: 'Game not found'
      };
    }

    // Get session to know which player is making the move
    const session = sessionId ? this.sessions.get(sessionId) : null;

    if (!session || !session.team) {
      return {
        success: false,
        message: 'No active session or team not assigned'
      };
    }

    // Validate spawn position for team
    if (session.team === 'red') {
      if (row < 0 || row > 16) {
        return {
          success: false,
          message: 'Invalid spawn position for red team (must be rows 0-16)'
        };
      }
    } else {
      if (row < 17 || row > 33) {
        return {
          success: false,
          message: 'Invalid spawn position for blue team (must be rows 17-33)'
        };
      }
    }

    // Get the player's current elixir
    const snapshot = room.getSnapshot();
    const player = snapshot.players.find(p => p.id === session.playerId);

    if (!player) {
      return {
        success: false,
        message: 'Player not found in game'
      };
    }

    // Check elixir cost
    const troopCosts: Record<string, number> = {
      'giant': 5,
      'babyDragon': 4,
      'miniPekka': 4,
      'valkyrie': 4
    };

    const cost = troopCosts[troopType] || 0;
    if (player.elixir < cost) {
      return {
        success: false,
        message: `Not enough elixir (have ${Math.floor(player.elixir)}, need ${cost})`,
        elixirRemaining: Math.floor(player.elixir)
      };
    }

    // Queue the action
    room.queueAction({
      type: 'PLAY_CARD',
      playerId: session.playerId,
      timestamp: Date.now(),
      data: {
        troopType,
        position: { row, col }
      }
    });

    return {
      success: true,
      troopId: `troop_${uuidv4().substring(0, 8)}`,
      message: `${troopType} deployed at position (${row}, ${col})`,
      elixirRemaining: Math.floor(player.elixir - cost)
    };
  }

  public getSession(sessionId: string): MCPSession | undefined {
    return this.sessions.get(sessionId);
  }

  public cleanupOldSessions(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(id);
      }
    }
  }
}