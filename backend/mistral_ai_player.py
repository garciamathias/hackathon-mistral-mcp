"""
Joueur IA Mistral pour Clash Royale
Utilise les outils MCP pour prendre des décisions stratégiques
"""

import asyncio
import random
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class MistralAIPlayer:
    def __init__(self, session_id: str, websocket_manager):
        self.session_id = session_id
        self.websocket_manager = websocket_manager
        self.team = "red"  # Mistral joue toujours en équipe rouge
        self.difficulty = "medium"  # easy, medium, hard
        self.thinking_delay = 2.0  # Délai de réflexion en secondes
        
        # Stratégie de base
        self.preferred_troops = ["giant", "babyDragon", "miniPekka", "valkyrie"]
        self.last_action_time = datetime.now()

    async def process_game_action(self, human_action):
        """Traite l'action du joueur humain et génère une réponse"""
        try:
            logger.info(f"🤖 Mistral AI processing human action: {human_action.type}")
            
            # Délai de réflexion pour rendre l'IA plus naturelle
            await asyncio.sleep(self.thinking_delay)
            
            # Analyser l'action de l'humain
            response_action = await self._generate_strategic_response(human_action)
            
            if response_action:
                # Envoyer l'action de Mistral au joueur humain
                await self.websocket_manager.send_mistral_action_to_human(
                    self.session_id, 
                    response_action
                )
                
                self.last_action_time = datetime.now()
                logger.info(f"🤖 Mistral AI responded with: {response_action.type}")
            
        except Exception as e:
            logger.error(f"Error in Mistral AI processing: {e}")

    async def _generate_strategic_response(self, human_action) -> Optional:
        """Génère une réponse stratégique à l'action humaine"""
        from .websocket_manager import GameAction
        
        if human_action.type == "SPAWN_TROOP":
            return await self._counter_troop_deployment(human_action)
        elif human_action.type == "GAME_STATE_UPDATE":
            return await self._analyze_game_state_and_act(human_action)
        
        return None

    async def _counter_troop_deployment(self, human_action) -> Optional:
        """Génère une contre-attaque basée sur la troupe déployée par l'humain"""
        from .websocket_manager import GameAction
        
        human_troop = human_action.payload.get("troopType")
        human_row = human_action.payload.get("row", 16)
        human_col = human_action.payload.get("col", 9)
        
        logger.info(f"🤖 Analyzing human deployment: {human_troop} at ({human_row}, {human_col})")
        
        # Stratégie de contre basée sur le type de troupe
        counter_strategy = self._get_counter_strategy(human_troop)
        
        # Choisir une position stratégique pour Mistral (côté rouge)
        mistral_row, mistral_col = self._choose_deployment_position(human_row, human_col)
        
        # Créer l'action de déploiement pour Mistral
        response_action = GameAction(
            action_type="MISTRAL_MOVE",
            payload={
                "troopType": counter_strategy["troop"],
                "row": mistral_row,
                "col": mistral_col,
                "team": "red",
                "reasoning": counter_strategy["reasoning"]
            },
            player_id="mistral_ai"
        )
        
        logger.info(f"🤖 Mistral counter: {counter_strategy['troop']} at ({mistral_row}, {mistral_col}) - {counter_strategy['reasoning']}")
        
        return response_action

    def _get_counter_strategy(self, human_troop: str) -> Dict[str, str]:
        """Détermine la meilleure contre-stratégie"""
        strategies = {
            "giant": {
                "troop": "miniPekka",
                "reasoning": "Mini PEKKA excelle contre les tanks comme le Giant"
            },
            "babyDragon": {
                "troop": "valkyrie", 
                "reasoning": "Valkyrie peut tanker les dégâts du Baby Dragon"
            },
            "miniPekka": {
                "troop": "valkyrie",
                "reasoning": "Valkyrie peut résister au Mini PEKKA"
            },
            "valkyrie": {
                "troop": "babyDragon",
                "reasoning": "Baby Dragon peut attaquer à distance contre Valkyrie"
            }
        }
        
        # Stratégie par défaut + un peu d'aléatoire
        default_strategy = {
            "troop": random.choice(self.preferred_troops),
            "reasoning": "Déploiement stratégique standard"
        }
        
        return strategies.get(human_troop, default_strategy)

    def _choose_deployment_position(self, human_row: int, human_col: int) -> tuple[int, int]:
        """Choisit une position de déploiement stratégique pour Mistral"""
        
        # Mistral joue du côté rouge (lignes 0-15)
        # Positions stratégiques possibles
        strategic_positions = [
            (14, 3),   # Côté gauche
            (14, 9),   # Centre
            (14, 15),  # Côté droit
            (12, 6),   # Centre-gauche
            (12, 12),  # Centre-droit
        ]
        
        # Si l'humain attaque un côté, défendre l'autre côté
        if human_col < 6:  # Humain attaque à gauche
            preferred_positions = [(14, 15), (12, 12), (14, 9)]
        elif human_col > 12:  # Humain attaque à droite  
            preferred_positions = [(14, 3), (12, 6), (14, 9)]
        else:  # Humain attaque au centre
            preferred_positions = [(14, 3), (14, 15), (12, 6), (12, 12)]
        
        # Choisir une position avec un peu d'aléatoire
        available_positions = preferred_positions if preferred_positions else strategic_positions
        return random.choice(available_positions)

    async def _analyze_game_state_and_act(self, game_state_action) -> Optional:
        """Analyse l'état du jeu et prend une décision proactive"""
        # Pour l'instant, on ne fait rien sur les updates d'état
        # Mais on pourrait analyser la situation et prendre des initiatives
        return None

    def set_difficulty(self, difficulty: str):
        """Ajuste la difficulté de l'IA"""
        self.difficulty = difficulty
        
        if difficulty == "easy":
            self.thinking_delay = 3.0
            # IA plus prévisible
        elif difficulty == "medium":
            self.thinking_delay = 2.0
        elif difficulty == "hard":
            self.thinking_delay = 1.0
            # IA plus agressive et rapide
        
        logger.info(f"🤖 Mistral AI difficulty set to: {difficulty}")
