/**
 * Client WebSocket pour la communication temps réel avec le serveur MCP
 * Permet au jeu Vercel de communiquer avec Mistral AI
 */

export interface GameAction {
  type: 'SPAWN_TROOP' | 'GAME_START' | 'GAME_STATE_UPDATE' | 'MISTRAL_MOVE';
  payload: any;
  timestamp: number;
  playerId: string;
}

export interface GameStateSync {
  troops: any[];
  towers: any[];
  gameTime: number;
  currentPlayer: 'human' | 'mistral';
  gameStatus: 'waiting' | 'playing' | 'ended';
}

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private playerId: string;
  
  // Callbacks
  private onGameStateUpdate: ((state: GameStateSync) => void) | null = null;
  private onMistralMove: ((action: GameAction) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  constructor(playerId: string = 'human_player') {
    this.playerId = playerId;
  }

  connect(serverUrl: string = 'wss://your-mcp-server.com/ws') {
    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 Connected to MCP server');
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
        
        // S'identifier comme joueur humain
        this.sendAction({
          type: 'GAME_START',
          payload: { playerId: this.playerId, playerType: 'human' },
          timestamp: Date.now(),
          playerId: this.playerId
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const action: GameAction = JSON.parse(event.data);
          this.handleServerMessage(action);
        } catch (error) {
          console.error('❌ Error parsing server message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from MCP server');
        this.onConnectionChange?.(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
    }
  }

  private handleServerMessage(action: GameAction) {
    switch (action.type) {
      case 'GAME_STATE_UPDATE':
        this.onGameStateUpdate?.(action.payload);
        break;
        
      case 'MISTRAL_MOVE':
        console.log('🤖 Mistral AI move:', action.payload);
        this.onMistralMove?.(action);
        break;
        
      default:
        console.log('📨 Unknown message type:', action.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  sendAction(action: GameAction) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(action));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send action');
    }
  }

  // Actions spécifiques du jeu
  spawnTroop(troopType: string, row: number, col: number) {
    this.sendAction({
      type: 'SPAWN_TROOP',
      payload: {
        troopType,
        row,
        col,
        team: 'blue' // Humain = équipe bleue
      },
      timestamp: Date.now(),
      playerId: this.playerId
    });
  }

  syncGameState(gameState: any) {
    this.sendAction({
      type: 'GAME_STATE_UPDATE',
      payload: gameState,
      timestamp: Date.now(),
      playerId: this.playerId
    });
  }

  // Event listeners
  onGameStateChange(callback: (state: GameStateSync) => void) {
    this.onGameStateUpdate = callback;
  }

  onMistralAction(callback: (action: GameAction) => void) {
    this.onMistralMove = callback;
  }

  onConnectionStatusChange(callback: (connected: boolean) => void) {
    this.onConnectionChange = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
