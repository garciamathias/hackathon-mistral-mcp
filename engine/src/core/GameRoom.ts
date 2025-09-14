import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from './GameEngine';
import { TickManager } from './TickManager';
import { GameStatus, PlayerState, GameSnapshot, PlayCardAction } from '@shared/game';
import { TroopType } from '@shared/troop';
import { WSClient } from '@/types/server';
import { SERVER_CONFIG } from '@config/constants';

export interface RoomOptions {
  maxPlayers?: number;
  tickRate?: number;
}

export class GameRoom {
  public readonly id: string;
  private engine: GameEngine;
  private tickManager: TickManager;
  private clients: Map<string, WSClient> = new Map();
  private players: Map<string, PlayerState> = new Map();
  private maxPlayers: number;
  private onSnapshotCallback?: (snapshot: GameSnapshot) => void;
  private inputQueue: PlayCardAction[] = [];
  private roomCreatedAt: number;
  private gameStartedAt?: number;

  constructor(options: RoomOptions = {}) {
    this.id = uuidv4();
    this.maxPlayers = options.maxPlayers || 2;
    this.engine = new GameEngine();
    this.tickManager = new TickManager(options.tickRate || SERVER_CONFIG.TICK_RATE);
    this.roomCreatedAt = Date.now();

    // Register tick callback
    this.tickManager.addCallback((deltaTime, tick) => {
      this.processTick(deltaTime, tick);
    });
  }

  private processTick(deltaTime: number, tick: number): void {
    // Process input queue
    this.processInputQueue();

    // Update game engine
    this.engine.update(deltaTime, tick);

    // Broadcast snapshot
    const snapshot = this.engine.getSnapshot();
    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
    }

    // Log status changes
    if (tick % 50 === 0) { // Log every 5 seconds (50 ticks at 10Hz)
      console.log(`[GameRoom] Room ${this.id} - Tick ${tick}, Status: ${snapshot.status}, Players: ${snapshot.players.length}, Game Time: ${snapshot.gameTime}s`);
    }

    // Check for game end
    if (this.engine.getStatus() === GameStatus.ENDED) {
      this.handleGameEnd();
    }
  }

  private processInputQueue(): void {
    while (this.inputQueue.length > 0) {
      const action = this.inputQueue.shift();
      if (!action) continue;

      if (action.type === 'PLAY_CARD' && action.data) {
        const { troopType, position } = action.data;
        this.engine.playCard(
          action.playerId,
          troopType as TroopType,
          position.row,
          position.col
        );
      }
    }
  }

  public addPlayer(playerId: string, name: string): PlayerState | null {
    // Check if player already exists - return existing player state
    if (this.players.has(playerId)) {
      console.log(`[GameRoom] Player ${playerId} (${name}) already in room ${this.id}, returning existing state`);
      const existingPlayer = this.players.get(playerId);
      if (existingPlayer) {
        // Update name if different
        if (existingPlayer.name !== name) {
          existingPlayer.name = name;
          console.log(`[GameRoom] Updated player name from ${existingPlayer.name} to ${name}`);
        }
        return existingPlayer;
      }
    }

    // Check if room is full
    if (this.players.size >= this.maxPlayers) {
      console.log(`[GameRoom] Room ${this.id} is FULL (${this.players.size}/${this.maxPlayers}). Cannot add player ${playerId} (${name})`);
      console.log(`[GameRoom] Current players:`, Array.from(this.players.keys()));
      return null;
    }

    // Determine team
    const redCount = Array.from(this.players.values()).filter(p => p.team === 'red').length;
    const blueCount = Array.from(this.players.values()).filter(p => p.team === 'blue').length;
    const team = redCount <= blueCount ? 'red' : 'blue';

    console.log(`[GameRoom] Adding NEW player ${playerId} (${name}) to room ${this.id} on team ${team}`);
    console.log(`[GameRoom] Room status before add: ${this.players.size}/${this.maxPlayers} players`);

    // Add to engine
    this.engine.addPlayer(playerId, name, team);

    // Get player state from engine
    const playerState = this.engine.getPlayers().find(p => p.id === playerId);
    if (playerState) {
      this.players.set(playerId, playerState);
      console.log(`[GameRoom] Successfully added player ${playerId} to room ${this.id}`);
      console.log(`[GameRoom] Room ${this.id} now has ${this.players.size}/${this.maxPlayers} players`);
      console.log(`[GameRoom] Players in room:`, Array.from(this.players.values()).map(p => ({ id: p.id, name: p.name, team: p.team })));
    } else {
      console.error(`[GameRoom] Failed to get player state from engine for ${playerId}`);
    }

    // Start game if room is full
    if (this.players.size === this.maxPlayers) {
      const currentStatus = this.engine.getStatus();
      console.log(`[GameRoom] Room ${this.id} is FULL. Current status: ${currentStatus}`);

      if (currentStatus === GameStatus.WAITING) {
        console.log(`[GameRoom] Starting game in room ${this.id} automatically!`);
        console.log(`[GameRoom] Waiting 1.5 seconds for WebSocket connections to establish...`);
        // Increased delay to ensure WebSocket connections are ready
        setTimeout(() => {
          console.log(`[GameRoom] Auto-start timer expired, attempting to start game...`);
          this.startGame();
        }, 1500); // Increased from 500ms to 1500ms
      } else {
        console.log(`[GameRoom] Game already started or ended. Status: ${currentStatus}`);
      }
    }

    return playerState || null;
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.engine.removePlayer(playerId);

    // Remove associated client
    for (const [clientId, client] of this.clients.entries()) {
      if (client.playerId === playerId) {
        this.clients.delete(clientId);
        break;
      }
    }

    // Pause game if not enough players
    if (this.players.size < 2 && this.engine.getStatus() === GameStatus.IN_PROGRESS) {
      this.pauseGame();
    }
  }

  public addClient(client: WSClient): void {
    this.clients.set(client.id, client);
  }

  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client && client.playerId) {
      const player = this.players.get(client.playerId);
      if (player) {
        player.isConnected = false;
      }
    }
    this.clients.delete(clientId);
  }

  public queueAction(action: PlayCardAction): void {
    // Validate player
    const player = this.players.get(action.playerId);
    if (!player) return;

    // Validate game state
    if (this.engine.getStatus() !== GameStatus.IN_PROGRESS) return;

    // Validate elixir
    if (action.type === 'PLAY_CARD' && action.data) {
      const canPlay = this.engine.canPlayCard(
        action.playerId,
        action.data.troopType as TroopType
      );
      if (!canPlay) return;
    }

    this.inputQueue.push(action);
  }

  public startGame(): void {
    const currentStatus = this.engine.getStatus();

    if (currentStatus !== GameStatus.WAITING) {
      console.log(`[GameRoom] Cannot start game in room ${this.id}. Current status: ${currentStatus}`);
      return;
    }

    console.log(`[GameRoom] Starting game in room ${this.id}...`);
    console.log(`[GameRoom] Connected clients: ${this.clients.size}`);
    console.log(`[GameRoom] Player count: ${this.players.size}/${this.maxPlayers}`);

    this.engine.startGame();
    this.tickManager.start();
    this.gameStartedAt = Date.now();

    const newStatus = this.engine.getStatus();
    console.log(`[GameRoom] ✅ Game STARTED in room ${this.id}!`);
    console.log(`[GameRoom] Game status changed from ${currentStatus} to ${newStatus}`);
    console.log(`[GameRoom] TickManager running: ${this.tickManager.isActive()}`);
    console.log(`[GameRoom] Players:`, Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      team: p.team
    })));

    // Force immediate broadcast of game start to all connected clients
    const snapshot = this.engine.getSnapshot();
    console.log(`[GameRoom] Broadcasting initial game snapshot with status: ${snapshot.status}`);
    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
      // Double broadcast to ensure clients get the update
      setTimeout(() => {
        const secondSnapshot = this.engine.getSnapshot();
        console.log(`[GameRoom] Second broadcast with status: ${secondSnapshot.status}`);
        this.onSnapshotCallback!(secondSnapshot);
      }, 100);
    } else {
      console.error(`[GameRoom] WARNING: No onSnapshotCallback registered!`);
    }
  }

  public pauseGame(): void {
    if (this.engine.getStatus() !== GameStatus.IN_PROGRESS) {
      return;
    }

    this.tickManager.pause();
    console.log(`Game paused in room ${this.id}`);
  }

  public resumeGame(): void {
    if (this.engine.getStatus() !== GameStatus.IN_PROGRESS) {
      return;
    }

    this.tickManager.resume();
    console.log(`Game resumed in room ${this.id}`);
  }

  private handleGameEnd(): void {
    this.tickManager.stop();
    const snapshot = this.engine.getSnapshot();

    console.log(`Game ended in room ${this.id}. Winner: ${snapshot.winner}`);

    // Notify clients with final snapshot
    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
    }

    // Schedule room cleanup after 30 seconds
    setTimeout(() => {
      this.destroy();
    }, 30000);
  }

  public getSnapshot(): GameSnapshot {
    return this.engine.getSnapshot();
  }

  public getStatus(): GameStatus {
    return this.engine.getStatus();
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getClients(): WSClient[] {
    return Array.from(this.clients.values());
  }

  public isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public onSnapshot(callback: (snapshot: GameSnapshot) => void): void {
    this.onSnapshotCallback = callback;
  }

  public getRoomInfo() {
    return {
      id: this.id,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
      status: this.engine.getStatus(),
      createdAt: this.roomCreatedAt,
      startedAt: this.gameStartedAt,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        isConnected: p.isConnected
      }))
    };
  }

  public destroy(): void {
    this.tickManager.destroy();
    this.engine.reset();
    this.clients.clear();
    this.players.clear();
    this.inputQueue = [];
    console.log(`Room ${this.id} destroyed`);
  }
}