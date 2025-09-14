import {
  ApiResponse,
  CreateMatchResponse,
  JoinMatchResponse,
  MatchInfo,
  GameSnapshot,
  PlayCardData
} from '@/types/backend';

// Use relative URLs to call Next.js API routes
// The session management is now handled server-side

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use relative URLs for Next.js API routes
    this.baseUrl = '';
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
          ...options.headers,
        },
        // Include cookies for session management
        credentials: 'same-origin'
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
    const response = await this.request<{ matches: MatchInfo[] }>('/api/match/list');

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

  // Note: Player ID and name are now managed server-side via cookies
  // No need for client-side getters/setters
}

// Export singleton instance
export const apiClient = new ApiClient();