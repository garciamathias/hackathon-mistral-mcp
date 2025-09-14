import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  WSClient,
  WSMessage,
  WSMessageType,
  WSErrorMessage,
  WSSnapshotMessage
} from '@/types/server';
import { GameRoom } from '@core/GameRoom';
import { GameSnapshot, PlayCardAction } from '@shared/game';
import { SERVER_CONFIG, ERROR_CODES } from '@config/constants';

export class WSManager {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private rooms: Map<string, GameRoom> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    const wsOptions: any = { server };

    // Add optional path support for production environments
    if (process.env.WS_PATH) {
      wsOptions.path = process.env.WS_PATH;
      console.log(`WebSocket server configured with path: ${process.env.WS_PATH}`);
    }

    this.wss = new WebSocketServer(wsOptions);
    this.setupWebSocketServer();
    this.startHeartbeat();
    console.log(`WebSocket server attached to HTTP server`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = uuidv4();
      const url = new URL(request.url || '', `http://localhost`);
      const roomId = url.searchParams.get('roomId');
      const playerId = url.searchParams.get('playerId');

      if (!roomId || !playerId) {
        this.sendError(ws, ERROR_CODES.INVALID_ACTION, 'Missing roomId or playerId');
        ws.close();
        return;
      }

      const client: WSClient = {
        id: clientId,
        ws,
        playerId,
        roomId,
        isAlive: true,
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      this.handleConnection(client);
    });
  }

  private handleConnection(client: WSClient): void {
    const { ws, roomId, playerId } = client;

    // Join room
    const room = this.rooms.get(roomId!);
    if (!room) {
      this.sendError(ws, ERROR_CODES.ROOM_NOT_FOUND, 'Room not found');
      ws.close();
      return;
    }

    room.addClient(client);
    const roomInfo = room.getRoomInfo();
    console.log(`[WSManager] Client ${client.id} (player: ${playerId}) joined room ${roomId}`);
    console.log(`[WSManager] Room status: ${roomInfo.status}, Players: ${roomInfo.playerCount}/${roomInfo.maxPlayers}`);

    // Setup message handlers
    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        this.sendError(ws, ERROR_CODES.INVALID_ACTION, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(client);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${client.id}:`, error);
      this.handleDisconnection(client);
    });

    ws.on('pong', () => {
      client.isAlive = true;
      client.lastPing = Date.now();
    });

    // Send initial snapshot
    const snapshot = room.getSnapshot();
    console.log(`[WSManager] Sending initial snapshot to client ${client.id} with game status: ${snapshot.status}`);
    this.sendSnapshot(ws, snapshot);
  }

  private handleMessage(client: WSClient, message: WSMessage): void {
    switch (message.type) {
      case WSMessageType.PLAY_CARD:
        this.handlePlayCard(client, message.data);
        break;

      case WSMessageType.GAME_ACTION:
        this.handleGameAction(client, message.data);
        break;

      case WSMessageType.PING:
        this.sendPong(client.ws);
        break;

      default:
        this.sendError(client.ws, ERROR_CODES.INVALID_ACTION, 'Unknown message type');
    }
  }

  private handlePlayCard(client: WSClient, data: any): void {
    if (!client.roomId || !client.playerId) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const action: PlayCardAction = {
      type: 'PLAY_CARD',
      playerId: client.playerId,
      timestamp: Date.now(),
      data: {
        troopType: data.troopType,
        position: data.position
      }
    };

    room.queueAction(action);
  }

  private handleGameAction(client: WSClient, data: any): void {
    if (!client.roomId) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    switch (data.action) {
      case 'PAUSE':
        room.pauseGame();
        break;
      case 'RESUME':
        room.resumeGame();
        break;
    }
  }

  private handleDisconnection(client: WSClient): void {
    if (client.roomId) {
      const room = this.rooms.get(client.roomId);
      if (room) {
        room.removeClient(client.id);
        console.log(`Client ${client.id} left room ${client.roomId}`);

        // Clean up empty rooms
        if (room.isEmpty()) {
          this.removeRoom(client.roomId);
        }
      }
    }

    this.clients.delete(client.id);
    client.ws.terminate();
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [, client] of this.clients.entries()) {
        if (!client.isAlive) {
          // Client didn't respond to last ping
          this.handleDisconnection(client);
          continue;
        }

        if (now - client.lastPing > SERVER_CONFIG.HEARTBEAT_INTERVAL) {
          client.isAlive = false;
          client.ws.ping();
        }
      }
    }, SERVER_CONFIG.HEARTBEAT_INTERVAL);
  }

  public createRoom(): GameRoom {
    const room = new GameRoom();
    this.rooms.set(room.id, room);

    // Setup snapshot broadcasting
    room.onSnapshot((snapshot) => {
      this.broadcastToRoom(room.id, snapshot);
    });

    console.log(`Created room ${room.id}`);
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
      console.log(`Removed room ${roomId}`);
    }
  }

  private broadcastToRoom(roomId: string, snapshot: GameSnapshot): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const clients = room.getClients();
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendSnapshot(client.ws, snapshot);
      }
    }
  }

  private sendSnapshot(ws: WebSocket, snapshot: GameSnapshot): void {
    const message: WSSnapshotMessage = {
      type: WSMessageType.GAME_SNAPSHOT,
      timestamp: Date.now(),
      data: { snapshot }
    };
    this.sendMessage(ws, message);
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    const errorMessage: WSErrorMessage = {
      type: WSMessageType.ERROR,
      timestamp: Date.now(),
      data: { code, message }
    };
    this.sendMessage(ws, errorMessage);
  }

  private sendPong(ws: WebSocket): void {
    const message: WSMessage = {
      type: WSMessageType.PONG,
      timestamp: Date.now()
    };
    this.sendMessage(ws, message);
  }

  private sendMessage(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getRoomList() {
    return Array.from(this.rooms.values()).map(room => room.getRoomInfo());
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    // Destroy all rooms
    for (const room of this.rooms.values()) {
      room.destroy();
    }

    this.wss.close();
    console.log('WebSocket server shut down');
  }
}