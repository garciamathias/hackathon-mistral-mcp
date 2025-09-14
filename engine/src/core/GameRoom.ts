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
    // Check if player already exists
    if (this.players.has(playerId)) {
      console.log(`Player ${playerId} already in room ${this.id}`);
      return this.players.get(playerId) || null;
    }

    if (this.players.size >= this.maxPlayers) {
      console.log(`Room ${this.id} is full (${this.players.size}/${this.maxPlayers})`);
      return null;
    }

    // Determine team
    const redCount = Array.from(this.players.values()).filter(p => p.team === 'red').length;
    const blueCount = Array.from(this.players.values()).filter(p => p.team === 'blue').length;
    const team = redCount <= blueCount ? 'red' : 'blue';

    console.log(`Adding player ${playerId} (${name}) to room ${this.id} on team ${team}`);

    // Add to engine
    this.engine.addPlayer(playerId, name, team);

    // Get player state from engine
    const playerState = this.engine.getPlayers().find(p => p.id === playerId);
    if (playerState) {
      this.players.set(playerId, playerState);
      console.log(`Room ${this.id} now has ${this.players.size}/${this.maxPlayers} players`);
    }

    // Start game if room is full
    if (this.players.size === this.maxPlayers && this.engine.getStatus() === GameStatus.WAITING) {
      console.log(`Starting game in room ${this.id}`);
      this.startGame();
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
    if (this.engine.getStatus() !== GameStatus.WAITING) {
      return;
    }

    this.engine.startGame();
    this.tickManager.start();
    this.gameStartedAt = Date.now();
    console.log(`Game started in room ${this.id}`);
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