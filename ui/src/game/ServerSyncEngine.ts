import { GameEngine } from './GameEngine';
import { TroopType } from './types/Troop';

export interface ServerGameState {
  game_id: string;
  troops: Array<{
    id: string;
    type: string;
    team: string;
    position: { row: number; col: number };
    health: number;
    max_health: number;
  }>;
  towers: Record<string, {
    id: string;
    team: string;
    type: string;
    health: number;
    max_health: number;
    position: { row: number; col: number };
  }>;
  elixir: { red: number; blue: number };
  available_cards: string[];
  game_time: number;
  tactical_analysis: string;
  is_game_over: boolean;
  winner: string | null;
}

export class ServerSyncEngine extends GameEngine {
  private gameId: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isAIMode: boolean = false;
  private serverUrl: string;

  constructor(serverUrl?: string) {
    super();
    this.serverUrl = serverUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000';
  }

  public setOnUpdate(callback: (troops: any[]) => void): void {
    this.onUpdateCallback = callback;
  }

  public setOnGameEnd(callback: (winner: 'red' | 'blue') => void): void {
    this.onGameEndCallback = callback;
  }

  // Override problematic methods from GameEngine
  protected cleanupDeadTroops(): void {
    // Override to prevent errors - ServerSyncEngine manages troops differently
    // Don't delete troops locally, let server manage lifecycle
    // But we still need to mark them as dead locally
    const deadTroops = Array.from(this.troops.entries())
      .filter(([, troop]) => {
        if (!troop || !troop.data) {
          console.warn('Troop missing data property:', troop);
          return false;
        }
        return !troop.data.isAlive;
      })
      .map(([id, ]) => id);

    for (const id of deadTroops) {
      // Instead of deleting, just mark as dead
      const troop = this.troops.get(id);
      if (troop && troop.data) {
        troop.data.isAlive = false;
      }
    }
  }

  // Remove the update() override - let parent class handle game logic
  // This allows troops to move locally using the existing GameEngine logic

  public async initializeServerGame(aiMode: boolean = false): Promise<string> {
    this.isAIMode = aiMode;

    try {
      const response = await fetch('/api/game/init', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize game');
      }

      const data = await response.json();
      this.gameId = data.game_id;

      // Start syncing with server
      this.startServerSync();

      return this.gameId;
    } catch (error) {
      console.error('Error initializing server game:', error);
      throw error;
    }
  }

  private startServerSync(): void {
    if (!this.gameId) return;

    console.log('🔄 Starting server sync polling for game:', this.gameId);

    // Poll every 500ms for updates
    this.syncInterval = setInterval(() => {
      console.log('⏰ Polling server for updates...');
      this.syncWithServer();
    }, 500);
  }

  private async syncWithServer(): Promise<void> {
    if (!this.gameId) return;

    try {
      const response = await fetch(`/api/game/state?game_id=${this.gameId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }

      const state: ServerGameState = await response.json();
      console.log('📦 Received server state:', {
        troopCount: state.troops?.length || 0,
        towerCount: Object.keys(state.towers || {}).length,
        gameTime: state.game_time,
        troops: state.troops
      });
      this.updateLocalState(state);
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }

  private updateLocalState(serverState: ServerGameState): void {
    console.log('🔄 updateLocalState called with:', {
      hasTroops: !!serverState.troops,
      troopCount: serverState.troops?.length || 0
    });

    // Track existing troop IDs
    const existingTroopIds = new Set(this.troops.keys());
    const serverTroopIds = new Set(serverState.troops?.map(t => t.id) || []);

    // Convert server troop type format (UPPER_SNAKE_CASE) to UI format (camelCase)
    const convertTroopType = (serverType: string): string => {
      const typeMap: Record<string, string> = {
        'GIANT': 'giant',
        'BABY_DRAGON': 'babyDragon',
        'MINI_PEKKA': 'miniPekka',
        'VALKYRIE': 'valkyrie'
      };
      return typeMap[serverType] || serverType.toLowerCase();
    };

    // Update troops from server (check if troops exists)
    if (serverState.troops && Array.isArray(serverState.troops)) {
      console.log('📊 Processing troops from server:', serverState.troops.length);

      serverState.troops.forEach(serverTroop => {
        // Check if this troop already exists locally
        if (this.troops.has(serverTroop.id)) {
          // Troop exists - just update health from server
          const existingTroop = this.troops.get(serverTroop.id);
          if (existingTroop && existingTroop.data) {
            existingTroop.data.health = serverTroop.health;
            existingTroop.data.isAlive = serverTroop.health > 0;
            console.log(`📝 Updated existing troop ${serverTroop.id} health: ${serverTroop.health}`);
          }
        } else {
          // New troop from server - spawn it locally
          console.log(`🆕 New troop from server: ${serverTroop.id}`);

          // Convert server troop type to UI format
          const uiTroopType = convertTroopType(serverTroop.type);

          // Spawn the troop using the parent GameEngine's spawnTroop method
          // This will create a proper troop entity with all the movement logic
          const troopId = super.spawnTroop(
            uiTroopType as TroopType,
            serverTroop.team as 'red' | 'blue',
            serverTroop.position.row,
            serverTroop.position.col
          );

          // Replace the auto-generated ID with the server ID
          const spawnedTroop = this.troops.get(troopId);
          if (spawnedTroop) {
            this.troops.delete(troopId);
            this.troops.set(serverTroop.id, spawnedTroop);
            if (spawnedTroop.data) {
              spawnedTroop.data.id = serverTroop.id;
              spawnedTroop.data.health = serverTroop.health;
              spawnedTroop.data.maxHealth = serverTroop.max_health || 100;
            }
          }

          console.log('🎮 Spawned new troop locally:', {
            id: serverTroop.id,
            type: uiTroopType,
            team: serverTroop.team,
            position: serverTroop.position
          });
        }
      });

      // Remove troops that are no longer on the server
      for (const localId of existingTroopIds) {
        if (!serverTroopIds.has(localId)) {
          console.log(`🗑️ Removing troop ${localId} (no longer on server)`);
          this.troops.delete(localId);
        }
      }

      console.log(`✅ Total troops in map: ${this.troops.size}`);
    } else {
      console.log('⚠️ No troops in server state or troops not an array');
    }

    // Update towers
    if (serverState.towers && typeof serverState.towers === 'object') {
      Object.entries(serverState.towers).forEach(([towerId, towerData]) => {
      const existingTower = this.towers.get(towerId);
      if (existingTower) {
        // Update health
        (existingTower as any).health = towerData.health;
        (existingTower as any).maxHealth = towerData.max_health;
      }
      });
    }

    // Update game state
    if (serverState.is_game_over && serverState.winner) {
      this.handleGameEnd(serverState.winner as 'red' | 'blue');
    }

    // No need to manually trigger UI update here anymore
    // The parent GameEngine's update() method will handle it
  }

  public async spawnTroopOnServer(
    type: TroopType,
    team: 'red' | 'blue',
    row: number,
    col: number
  ): Promise<boolean> {
    if (!this.gameId) {
      console.error('No game ID available');
      return false;
    }

    // Convert TroopType enum value to the format expected by Python server
    const troopTypeMap: Record<string, string> = {
      'giant': 'GIANT',
      'babyDragon': 'BABY_DRAGON',
      'miniPekka': 'MINI_PEKKA',
      'valkyrie': 'VALKYRIE'
    };

    const serverTroopType = troopTypeMap[type] || type.toUpperCase();

    const requestData = {
      game_id: this.gameId,
      troop_type: serverTroopType,
      position: { row, col },
      team,
    };

    console.log('=== SENDING SPAWN REQUEST ===');
    console.log('Data:', JSON.stringify(requestData, null, 2));

    try {
      const response = await fetch('/api/game/spawn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to spawn troop - Response:', errorText);
        try {
          const error = JSON.parse(errorText);
          console.error('Error details:', error);
        } catch (e) {
          console.error('Could not parse error response');
        }
        return false;
      }

      const result = await response.json();

      if (result.success) {
        // Server will update state, we'll receive it via sync
        console.log('Troop spawned successfully:', result.message);
        return true;
      } else {
        console.error('Failed to spawn troop:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error spawning troop on server:', error);
      return false;
    }
  }

  // Override parent spawnTroop to use server
  public spawnTroop(type: TroopType, team: 'red' | 'blue', row?: number, col?: number): string {
    if (this.gameId) {
      // In server mode, spawn via server
      const spawnRow = row ?? (team === 'red' ? 10 : 23);
      const spawnCol = col ?? 8;

      this.spawnTroopOnServer(type, team, spawnRow, spawnCol);
      return `${type}_${team}_pending`; // Return temporary ID
    } else {
      // Fallback to local mode
      return super.spawnTroop(type, team, row, col);
    }
  }

  private handleGameEnd(winner: 'red' | 'blue'): void {
    this.gameState.isRunning = false;

    if (this.onGameEndCallback) {
      this.onGameEndCallback(winner);
    }

    this.cleanup();
  }

  private cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public stop(): void {
    this.cleanup();
    super.stop();
  }

  public reset(): void {
    this.cleanup();
    this.gameId = null;
    super.reset();
  }

  public getGameId(): string | null {
    return this.gameId;
  }

  public getTacticalAnalysis(): string {
    // This would be populated from server state
    return 'Waiting for server analysis...';
  }
}