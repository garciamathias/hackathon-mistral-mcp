import {
  WSMessage,
  WSMessageType,
  GameSnapshot,
  PlayCardData,
  EmoteEventData
} from '@/types/backend';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketOptions {
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WSMessage) => void;
  onEmote?: (emoteData: EmoteEventData) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private options: WebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(options: WebSocketOptions = {}) {
    this.options = options;
  }

  connect(wsUrl: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.url = wsUrl;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  private establishConnection(): void {
    try {
      this.updateStatus('connecting');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateStatus('error');
        this.options.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.updateStatus('disconnected');
        this.stopPingInterval();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.updateStatus('error');
      this.attemptReconnect();
    }
  }

  private handleMessage(message: WSMessage): void {
    this.options.onMessage?.(message);

    switch (message.type) {
      case WSMessageType.GAME_SNAPSHOT:
        if (message.data?.snapshot) {
          this.options.onSnapshot?.(message.data.snapshot);
        }
        break;

      case WSMessageType.ERROR:
        console.error('Server error:', message.data);
        this.options.onError?.(new Error(message.data?.message || 'Server error'));
        break;

      case WSMessageType.PONG:
        // Heartbeat response received
        break;

      case WSMessageType.EMOTE_EVENT:
        if (message.data) {
          this.options.onEmote?.(message.data as EmoteEventData);
        }
        break;

      default:
        // Handle other message types if needed
        break;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    this.send({
      type: WSMessageType.PING,
      timestamp: Date.now()
    });
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  send(message: WSMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  playCard(troopType: string, position: { row: number; col: number }): void {
    this.send({
      type: WSMessageType.PLAY_CARD,
      timestamp: Date.now(),
      data: {
        troopType,
        position
      } as PlayCardData
    });
  }

  sendGameAction(action: string): void {
    this.send({
      type: WSMessageType.GAME_ACTION,
      timestamp: Date.now(),
      data: { action }
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}