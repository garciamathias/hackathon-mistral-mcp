import {
  ApiResponse,
  CreateMatchResponse,
  JoinMatchResponse,
  MatchInfo,
  GameSnapshot,
  PlayCardData
} from '@/types/backend';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private playerId: string;
  private playerName: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Generate or retrieve player ID (in production, use proper auth)
    this.playerId = this.getOrCreatePlayerId();
    this.playerName = this.getOrCreatePlayerName();
  }

  private getOrCreatePlayerId(): string {
    // Always generate a new unique player ID for each session
    // This prevents conflicts when multiple users join from the same browser
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('playerId', playerId);
    return playerId;
  }

  private getOrCreatePlayerName(): string {
    let playerName = localStorage.getItem('playerName');
    if (!playerName) {
      playerName = `Player_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('playerName', playerName);
    }
    return playerName;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': this.playerId,
          'x-player-name': this.playerName,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          code: 'REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      };
    }
  }

  // Match Management
  async createMatch(): Promise<CreateMatchResponse | null> {
    const response = await this.request<CreateMatchResponse>('/api/match/create', {
      method: 'POST',
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  async joinMatch(matchId: string): Promise<JoinMatchResponse | null> {
    const response = await this.request<JoinMatchResponse>('/api/match/join', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  async getMatchInfo(matchId: string): Promise<MatchInfo | null> {
    const response = await this.request<MatchInfo>(`/api/match/${matchId}`);

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  async listMatches(): Promise<MatchInfo[]> {
    const response = await this.request<{ matches: MatchInfo[] }>('/api/match');

    if (response.success && response.data) {
      return response.data.matches;
    }
    return [];
  }

  // Game Actions
  async playCard(
    matchId: string,
    troopType: string,
    position: { row: number; col: number }
  ): Promise<boolean> {
    const response = await this.request('/api/game/play_card', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        troopType,
        position,
      }),
    });

    return response.success;
  }

  async getGameState(matchId: string): Promise<GameSnapshot | null> {
    const response = await this.request<GameSnapshot>(`/api/game/state/${matchId}`);

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  async performGameAction(
    matchId: string,
    action: 'PAUSE' | 'RESUME' | 'SURRENDER'
  ): Promise<boolean> {
    const response = await this.request('/api/game/action', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        action,
      }),
    });

    return response.success;
  }

  async getTroopTypes(): Promise<any[]> {
    const response = await this.request<{ troops: any[] }>('/api/game/troops');

    if (response.success && response.data) {
      return response.data.troops;
    }
    return [];
  }

  // Getters
  getPlayerId(): string {
    return this.playerId;
  }

  getPlayerName(): string {
    return this.playerName;
  }

  setPlayerName(name: string): void {
    this.playerName = name;
    localStorage.setItem('playerName', name);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();