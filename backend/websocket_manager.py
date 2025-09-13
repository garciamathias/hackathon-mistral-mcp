"""
Gestionnaire WebSocket pour la communication temps réel
Entre le jeu Vercel et Mistral AI via MCP
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class GameAction:
    def __init__(self, action_type: str, payload: Dict[str, Any], player_id: str):
        self.type = action_type
        self.payload = payload
        self.player_id = player_id
        self.timestamp = datetime.now().isoformat()
        self.id = str(uuid.uuid4())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "payload": self.payload,
            "playerId": self.player_id,
            "timestamp": self.timestamp,
            "id": self.id
        }

class GameSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.human_player: Optional[WebSocket] = None
        self.mistral_player: Optional["MistralAIPlayer"] = None
        self.current_player: str = "human"
        self.game_state: Dict[str, Any] = {
            "troops": [],
            "towers": [],
            "gameTime": 0,
            "status": "waiting"
        }
        self.action_history: List[GameAction] = []

    def add_human_player(self, websocket: WebSocket):
        self.human_player = websocket
        logger.info(f"Human player connected to session {self.session_id}")

    def add_mistral_player(self, mistral_player):
        self.mistral_player = mistral_player
        logger.info(f"Mistral AI connected to session {self.session_id}")

    async def broadcast_to_human(self, action: GameAction):
        if self.human_player:
            try:
                await self.human_player.send_text(json.dumps(action.to_dict()))
            except Exception as e:
                logger.error(f"Error sending to human player: {e}")

    async def send_to_mistral(self, action: GameAction):
        if self.mistral_player:
            try:
                await self.mistral_player.process_game_action(action)
            except Exception as e:
                logger.error(f"Error sending to Mistral: {e}")

    def update_game_state(self, new_state: Dict[str, Any]):
        self.game_state.update(new_state)
        logger.debug(f"Game state updated for session {self.session_id}")

    def switch_turn(self):
        self.current_player = "mistral" if self.current_player == "human" else "human"
        logger.info(f"Turn switched to {self.current_player} in session {self.session_id}")

class WebSocketManager:
    def __init__(self):
        self.sessions: Dict[str, GameSession] = {}
        self.active_connections: Dict[str, WebSocket] = {}

    def create_session(self, session_id: str = None) -> str:
        if not session_id:
            session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = GameSession(session_id)
        logger.info(f"Created new game session: {session_id}")
        return session_id

    async def connect_human_player(self, websocket: WebSocket, session_id: str = None):
        await websocket.accept()
        
        if not session_id:
            session_id = self.create_session()
        elif session_id not in self.sessions:
            self.create_session(session_id)

        session = self.sessions[session_id]
        session.add_human_player(websocket)
        
        connection_id = f"human_{session_id}"
        self.active_connections[connection_id] = websocket

        # Envoyer confirmation de connexion
        welcome_action = GameAction(
            action_type="CONNECTION_ESTABLISHED",
            payload={
                "sessionId": session_id,
                "playerType": "human",
                "currentPlayer": session.current_player
            },
            player_id="system"
        )
        
        await websocket.send_text(json.dumps(welcome_action.to_dict()))
        
        return session_id

    async def handle_human_action(self, websocket: WebSocket, session_id: str, message: str):
        try:
            data = json.loads(message)
            action = GameAction(
                action_type=data.get("type"),
                payload=data.get("payload", {}),
                player_id=data.get("playerId", "human")
            )

            session = self.sessions.get(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                return

            # Traiter l'action selon son type
            if action.type == "SPAWN_TROOP":
                await self._handle_troop_spawn(session, action)
            elif action.type == "GAME_STATE_UPDATE":
                await self._handle_game_state_update(session, action)
            elif action.type == "GAME_START":
                await self._handle_game_start(session, action)

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from human player")
        except Exception as e:
            logger.error(f"Error handling human action: {e}")

    async def _handle_troop_spawn(self, session: GameSession, action: GameAction):
        """Traite le déploiement d'une troupe par l'humain"""
        if session.current_player != "human":
            logger.warning("Not human's turn")
            return

        # Ajouter l'action à l'historique
        session.action_history.append(action)
        
        # Passer le tour à Mistral
        session.switch_turn()
        
        # Envoyer l'action à Mistral pour qu'il réponde
        await session.send_to_mistral(action)
        
        logger.info(f"Human deployed {action.payload.get('troopType')} at ({action.payload.get('row')}, {action.payload.get('col')})")

    async def _handle_game_state_update(self, session: GameSession, action: GameAction):
        """Met à jour l'état du jeu"""
        session.update_game_state(action.payload)

    async def _handle_game_start(self, session: GameSession, action: GameAction):
        """Démarre une partie"""
        session.game_state["status"] = "playing"
        session.current_player = "human"
        
        # Initialiser Mistral AI pour cette session
        if not session.mistral_player:
            from .mistral_ai_player import MistralAIPlayer
            session.mistral_player = MistralAIPlayer(session.session_id, self)
        
        logger.info(f"Game started in session {session.session_id}")

    async def send_mistral_action_to_human(self, session_id: str, action: GameAction):
        """Envoie l'action de Mistral au joueur humain"""
        session = self.sessions.get(session_id)
        if session:
            await session.broadcast_to_human(action)
            session.switch_turn()  # Repasser le tour à l'humain

    def disconnect_human_player(self, session_id: str):
        connection_id = f"human_{session_id}"
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.human_player = None
            logger.info(f"Human player disconnected from session {session_id}")

    def get_session(self, session_id: str) -> Optional[GameSession]:
        return self.sessions.get(session_id)

# Instance globale
websocket_manager = WebSocketManager()
