import { apiClient } from './api';
import { WebSocketClient, ConnectionStatus } from './websocket';
import {
  GameSnapshot,
  GameStatus,
  PlayerState,
  TroopData,
  TowerData,
  CreateMatchResponse,
  JoinMatchResponse,
  EmoteEventData
} from '@/types/backend';

export interface GameClientOptions {
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onGameEnd?: (winner: 'red' | 'blue' | 'draw') => void;
  onEmote?: (emoteData: EmoteEventData) => void;
  onError?: (error: Error) => void;
}

export class GameClient {
  private wsClient: WebSocketClient;
  private currentMatchId: string | null = null;
  private currentSnapshot: GameSnapshot | null = null;
  private playerState: PlayerState | null = null;
  private options: GameClientOptions;
  private isHost: boolean = false;

  constructor(options: GameClientOptions = {}) {
    this.options = options;

    this.wsClient = new WebSocketClient({
      onSnapshot: (snapshot) => this.handleSnapshot(snapshot),
      onStatusChange: (status) => this.options.onStatusChange?.(status),
      onEmote: (emoteData) => this.options.onEmote?.(emoteData),
      onError: (error) => this.options.onError?.(error),
    });
  }

  // Match Management
  async createMatch(): Promise<boolean> {
    try {
      const response = await apiClient.createMatch();
      if (!response) {
        throw new Error('Failed to create match');
      }

      this.currentMatchId = response.matchId;
      this.isHost = true;

      // Store player info if available
      if (response.playerState) {
        this.playerState = response.playerState;
        sessionStorage.setItem('playerId', response.playerState.id);
        sessionStorage.setItem('playerName', response.playerState.name);
      }

      // Connect to WebSocket
      const wsUrl = this.buildWebSocketUrl(response.wsUrl);
      this.wsClient.connect(wsUrl);

      return true;
    } catch (error) {
      console.error('Failed to create match:', error);
      this.options.onError?.(error as Error);
      return false;
    }
  }

  async joinMatch(matchId: string): Promise<boolean> {
    try {
      const response = await apiClient.joinMatch(matchId);
      if (!response) {
        throw new Error('Failed to join match');
      }

      this.currentMatchId = matchId;
      this.playerState = response.playerState;
      this.isHost = false;

      // Store player ID in sessionStorage for later use
      if (response.playerState) {
        sessionStorage.setItem('playerId', response.playerState.id);
        sessionStorage.setItem('playerName', response.playerState.name);
      }

      // Connect to WebSocket
      const wsUrl = this.buildWebSocketUrl(response.wsUrl);
      this.wsClient.connect(wsUrl);

      return true;
    } catch (error) {
      console.error('Failed to join match:', error);
      this.options.onError?.(error as Error);
      return false;
    }
  }

  private buildWebSocketUrl(baseUrl: string): string {
    // The WebSocket URL is now provided complete by the server
    // It already includes the correct player ID and room ID
    return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  // Game Actions
  playCard(troopType: string, row: number, col: number): void {
    if (!this.currentMatchId) {
      console.error('No active match');
      return;
    }

    // Check if player has enough elixir
    if (this.playerState && !this.canPlayCard(troopType)) {
      console.warn('Not enough elixir to play card');
      return;
    }

    // Send via WebSocket for real-time update
    this.wsClient.playCard(troopType, { row, col });

    // REST API backup disabled - endpoint doesn't exist
    // apiClient.playCard(this.currentMatchId, troopType, { row, col });
  }

  private canPlayCard(troopType: string): boolean {
    if (!this.playerState) return false;

    // Check elixir cost (you'll need to import troop configs)
    const troopCosts: Record<string, number> = {
      'giant': 5,
      'babyDragon': 4,
      'miniPekka': 4,
      'valkyrie': 4
    };

    const cost = troopCosts[troopType] || 0;
    return this.playerState.elixir >= cost;
  }

  pauseGame(): void {
    if (!this.currentMatchId) return;

    this.wsClient.sendGameAction('PAUSE');
    // REST API backup disabled - endpoint doesn't exist
    // apiClient.performGameAction(this.currentMatchId, 'PAUSE');
  }

  resumeGame(): void {
    if (!this.currentMatchId) return;

    this.wsClient.sendGameAction('RESUME');
    // REST API backup disabled - endpoint doesn't exist
    // apiClient.performGameAction(this.currentMatchId, 'RESUME');
  }

  surrender(): void {
    if (!this.currentMatchId) return;

    this.wsClient.sendGameAction('SURRENDER');
    // REST API backup disabled - endpoint doesn't exist
    // apiClient.performGameAction(this.currentMatchId, 'SURRENDER');
  }

  // State Management
  private handleSnapshot(snapshot: GameSnapshot): void {
    this.currentSnapshot = snapshot;

    // Update player state - get player ID from sessionStorage
    const playerId = sessionStorage.getItem('playerId');
    if (playerId) {
      const player = snapshot.players.find(p => p.id === playerId);
      if (player) {
        this.playerState = player;
      }
    }

    // Check for game end
    if (snapshot.status === GameStatus.ENDED && snapshot.winner) {
      this.options.onGameEnd?.(snapshot.winner);
    }

    // Forward to callback
    this.options.onSnapshot?.(snapshot);
  }

  // Getters
  getSnapshot(): GameSnapshot | null {
    return this.currentSnapshot;
  }

  getTroops(): TroopData[] {
    return this.currentSnapshot?.troops || [];
  }

  getTowers(): TowerData[] {
    return this.currentSnapshot?.towers || [];
  }

  getPlayers(): PlayerState[] {
    return this.currentSnapshot?.players || [];
  }

  getPlayerState(): PlayerState | null {
    return this.playerState;
  }

  getPlayerTeam(): 'red' | 'blue' | null {
    return this.playerState?.team || null;
  }

  getPlayerElixir(): number {
    return this.playerState?.elixir || 0;
  }

  getGameStatus(): GameStatus | null {
    return this.currentSnapshot?.status || null;
  }

  getGameTime(): number {
    return this.currentSnapshot?.gameTime || 0;
  }

  getMatchId(): string | null {
    return this.currentMatchId;
  }

  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  getConnectionStatus(): ConnectionStatus {
    return this.wsClient.getStatus();
  }

  // Cleanup
  disconnect(): void {
    this.wsClient.disconnect();
    this.currentMatchId = null;
    this.currentSnapshot = null;
    this.playerState = null;
    this.isHost = false;
  }

  destroy(): void {
    this.disconnect();
  }
}

// Export singleton for easy use
export const gameClient = new GameClient();