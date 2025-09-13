/**
 * Hook pour gérer le jeu multijoueur Humain vs Mistral AI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameWebSocketClient, GameAction, GameStateSync } from '@/lib/websocket-client';
import { TroopType } from '@/game/types/Troop';
import { gameEngine } from '@/game/GameEngine';

export interface MultiplayerGameState {
  isConnected: boolean;
  isGameActive: boolean;
  currentPlayer: 'human' | 'mistral';
  mistralThinking: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useMultiplayerGame = () => {
  const [gameState, setGameState] = useState<MultiplayerGameState>({
    isConnected: false,
    isGameActive: false,
    currentPlayer: 'human',
    mistralThinking: false,
    connectionStatus: 'disconnected'
  });

  const wsClient = useRef<GameWebSocketClient | null>(null);

  // Initialiser la connexion WebSocket
  const connectToMCPServer = useCallback((serverUrl?: string) => {
    if (wsClient.current) {
      wsClient.current.disconnect();
    }

    const playerId = `human_${Date.now()}`;
    wsClient.current = new GameWebSocketClient(playerId);

    // Configuration des callbacks
    wsClient.current.onConnectionStatusChange((connected) => {
      setGameState(prev => ({
        ...prev,
        isConnected: connected,
        connectionStatus: connected ? 'connected' : 'disconnected'
      }));
    });

    wsClient.current.onGameStateChange((syncState: GameStateSync) => {
      console.log('🎮 Game state sync from server:', syncState);
      
      setGameState(prev => ({
        ...prev,
        currentPlayer: syncState.currentPlayer,
        isGameActive: syncState.gameStatus === 'playing'
      }));

      // Synchroniser avec le moteur de jeu local
      // TODO: Appliquer les changements d'état du serveur au gameEngine local
    });

    wsClient.current.onMistralAction((action: GameAction) => {
      console.log('🤖 Mistral AI action received:', action);
      
      setGameState(prev => ({ ...prev, mistralThinking: false }));

      // Exécuter l'action de Mistral dans le jeu local
      if (action.type === 'SPAWN_TROOP') {
        const { troopType, row, col } = action.payload;
        
        // Mistral joue toujours en équipe rouge
        gameEngine.spawnTroop(troopType as TroopType, 'red', row, col);
        
        // Passer le tour à l'humain
        setGameState(prev => ({ ...prev, currentPlayer: 'human' }));
      }
    });

    // Se connecter au serveur MCP
    const mcpServerUrl = serverUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'ws://localhost:8000/ws';
    setGameState(prev => ({ ...prev, connectionStatus: 'connecting' }));
    wsClient.current.connect(mcpServerUrl);
  }, []);

  // Déployer une troupe (action humaine)
  const deployTroop = useCallback((troopType: TroopType, row: number, col: number) => {
    if (!wsClient.current || !gameState.isConnected) {
      console.warn('⚠️ Not connected to MCP server');
      return false;
    }

    if (gameState.currentPlayer !== 'human') {
      console.warn('⚠️ Not your turn!');
      return false;
    }

    // Déployer localement
    gameEngine.spawnTroop(troopType, 'blue', row, col);

    // Envoyer l'action au serveur MCP
    wsClient.current.spawnTroop(troopType, row, col);

    // Passer le tour à Mistral
    setGameState(prev => ({ 
      ...prev, 
      currentPlayer: 'mistral',
      mistralThinking: true 
    }));

    return true;
  }, [gameState.isConnected, gameState.currentPlayer]);

  // Démarrer une partie multijoueur
  const startMultiplayerGame = useCallback(() => {
    if (!wsClient.current) {
      console.error('❌ WebSocket client not initialized');
      return;
    }

    // Démarrer le jeu local
    gameEngine.start();

    // Synchroniser l'état initial avec le serveur
    const initialState = {
      troops: gameEngine.getAllTroops(),
      towers: gameEngine.getAllTowers(),
      gameTime: 0,
      currentPlayer: 'human' as const,
      gameStatus: 'playing' as const
    };

    wsClient.current.syncGameState(initialState);

    setGameState(prev => ({
      ...prev,
      isGameActive: true,
      currentPlayer: 'human'
    }));
  }, []);

  // Synchroniser périodiquement l'état du jeu
  useEffect(() => {
    if (!gameState.isGameActive || !wsClient.current) return;

    const syncInterval = setInterval(() => {
      const currentState = {
        troops: gameEngine.getAllTroops(),
        towers: gameEngine.getAllTowers(),
        gameTime: gameEngine.getGameStats().gameTime,
        currentPlayer: gameState.currentPlayer,
        gameStatus: 'playing' as const
      };

      wsClient.current?.syncGameState(currentState);
    }, 1000); // Sync toutes les secondes

    return () => clearInterval(syncInterval);
  }, [gameState.isGameActive, gameState.currentPlayer]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, []);

  return {
    gameState,
    connectToMCPServer,
    deployTroop,
    startMultiplayerGame,
    disconnect: () => wsClient.current?.disconnect()
  };
};
