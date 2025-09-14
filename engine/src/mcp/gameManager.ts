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
      message: `Game created! You are on team ${playerState.team}. Match ID: ${room.id}`,
      sessionId: session.sessionId,
      playerId: session.playerId
    };
  }

  public joinGame(matchId: string, playerName?: string, sessionId?: string): JoinGameResponse {
    const session = this.getOrCreateSession(sessionId);

    if (playerName) {
      session.playerName = playerName;
    }

    console.log(`[MCPGameManager] Attempting to join game ${matchId} with player ${session.playerId} (${session.playerName})`);

    const room = this.wsManager.getRoom(matchId);

    if (!room) {
      console.log(`[MCPGameManager] Room ${matchId} not found`);
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: 0,
        message: 'Game not found'
      };
    }

    // Check if this specific player is already in the room
    const roomInfo = room.getRoomInfo();
    const existingPlayer = roomInfo.players.find(p => p.id === session.playerId);

    if (existingPlayer) {
      console.log(`[MCPGameManager] Player ${session.playerId} already in room, returning existing state`);
      session.currentMatchId = room.id;
      session.team = existingPlayer.team;

      return {
        success: true,
        matchId: room.id,
        team: existingPlayer.team,
        wsUrl: `ws://localhost:3001?roomId=${room.id}&playerId=${session.playerId}`,
        playerCount: room.getPlayerCount(),
        message: `Already in game on team ${existingPlayer.team}`,
        sessionId: session.sessionId,
        playerId: session.playerId
      };
    }

    // Check if room is full (and player is not already in it)
    if (room.isFull()) {
      console.log(`[MCPGameManager] Room ${matchId} is full (${room.getPlayerCount()} players)`);
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: room.getPlayerCount(),
        message: 'Game is full'
      };
    }

    // Try to add player to the room
    console.log(`[MCPGameManager] Adding player ${session.playerId} to room ${matchId}`);
    const playerState = room.addPlayer(session.playerId, session.playerName);

    if (!playerState) {
      console.error(`[MCPGameManager] Failed to add player ${session.playerId} to room ${matchId}`);
      return {
        success: false,
        matchId,
        team: 'red',
        wsUrl: '',
        playerCount: room.getPlayerCount(),
        message: 'Failed to join game - room may be full'
      };
    }

    session.currentMatchId = matchId;
    session.team = playerState.team;

    console.log(`[MCPGameManager] Successfully joined game ${matchId} on team ${playerState.team}`);
    console.log(`[MCPGameManager] Room now has ${room.getPlayerCount()} players`);

    // Start game if room is now full
    if (room.isFull()) {
      console.log(`[MCPGameManager] Room is full, starting game`);
      room.startGame();
    }

    return {
      success: true,
      matchId,
      team: playerState.team,
      wsUrl: `ws://localhost:3001?roomId=${matchId}&playerId=${session.playerId}`,
      playerCount: room.getPlayerCount(),
      message: `Joined game! You are on team ${playerState.team}. ${room.isFull() ? 'Game starting!' : 'Waiting for another player...'}`,
      sessionId: session.sessionId,
      playerId: session.playerId
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
    let session = sessionId ? this.sessions.get(sessionId) : null;
    let playerTeam: 'red' | 'blue' | undefined;

    // If no session found, try to find the MCP player in the room
    if (!session || !session.team) {
      console.log(`[MCPGameManager] No session found for sessionId: ${sessionId}, trying fallback`);

      // Get room info and find MCP player
      const roomInfo = room.getRoomInfo();
      const mcpPlayer = roomInfo.players.find(p => p.id.startsWith('mcp_'));

      if (mcpPlayer) {
        console.log(`[MCPGameManager] Found MCP player ${mcpPlayer.id} on team ${mcpPlayer.team}`);
        playerTeam = mcpPlayer.team;

        // Create/update session for this player
        if (!session) {
          session = {
            sessionId: sessionId || `auto_${Date.now()}`,
            playerId: mcpPlayer.id,
            playerName: mcpPlayer.name,
            team: mcpPlayer.team,
            currentMatchId: matchId,
            createdAt: Date.now(),
            lastActivity: Date.now()
          };
          this.sessions.set(session.sessionId, session);
        } else {
          session.team = mcpPlayer.team;
        }
      } else {
        return {
          success: false,
          message: 'No MCP player found in the game'
        };
      }
    } else {
      playerTeam = session.team;
    }

    // Validate spawn position for team
    if (playerTeam === 'red') {
      if (row < 0 || row > 16) {
        return {
          success: false,
          message: 'Invalid spawn position for red team (must be rows 0-16)'
        };
      }
    } else if (playerTeam === 'blue') {
      if (row < 17 || row > 33) {
        return {
          success: false,
          message: 'Invalid spawn position for blue team (must be rows 17-33)'
        };
      }
    } else {
      return {
        success: false,
        message: 'Team not defined'
      };
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