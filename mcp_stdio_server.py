#!/usr/bin/env python3
"""
Serveur MCP officiel pour Clash Royale
Compatible avec le SDK MCP officiel et Alpic.ai
"""

import asyncio
import json
import sys
from typing import Dict, Any, List
from datetime import datetime
import logging

# Import du SDK MCP officiel
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, CallToolResult

# Configuration des logs
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

class ClashRoyaleMCPServer:
    """Serveur MCP officiel pour Clash Royale compatible Alpic.ai"""
    
    def __init__(self):
        self.game_state = {
            "troops": [],
            "towers": self._initialize_towers(),
            "gameTime": 0,
            "isRunning": False,
            "currentPlayer": "human"
        }
        self.troop_counter = 0
        
    def _initialize_towers(self):
        """Initialise les tours par défaut"""
        return [
            {"id": "blue_king", "team": "blue", "type": "king", "health": 4824, "maxHealth": 4824, "row": 2, "col": 9},
            {"id": "blue_princess_left", "team": "blue", "type": "princess", "health": 3052, "maxHealth": 3052, "row": 6, "col": 3},
            {"id": "blue_princess_right", "team": "blue", "type": "princess", "health": 3052, "maxHealth": 3052, "row": 6, "col": 15},
            {"id": "red_king", "team": "red", "type": "king", "health": 4824, "maxHealth": 4824, "row": 30, "col": 9},
            {"id": "red_princess_left", "team": "red", "type": "princess", "health": 3052, "maxHealth": 3052, "row": 26, "col": 3},
            {"id": "red_princess_right", "team": "red", "type": "princess", "health": 3052, "maxHealth": 3052, "row": 26, "col": 15}
        ]

    async def start_game(self) -> Dict[str, Any]:
        """Démarre une nouvelle partie"""
        self.game_state["isRunning"] = True
        self.game_state["gameTime"] = 0
        self.game_state["troops"] = []
        self.troop_counter = 0
        
        return {
            "status": "Partie démarrée!",
            "message": "Vous êtes Mistral AI (équipe rouge). L'humain joue en équipe bleue.",
            "gameState": self.game_state
        }

    async def deploy_troop(self, troop_type: str, row: int, col: int) -> Dict[str, Any]:
        """Déploie une troupe pour Mistral (équipe rouge)"""
        # Validation
        if row > 15:
            raise ValueError("Mistral (équipe rouge) ne peut déployer que sur les lignes 0-15")
        
        # Statistiques des troupes
        troop_stats = {
            "giant": {"health": 4416, "damage": 253, "speed": 1.2},
            "babyDragon": {"health": 1152, "damage": 161, "speed": 2.0},
            "miniPekka": {"health": 1361, "damage": 720, "speed": 1.8},
            "valkyrie": {"health": 1908, "damage": 267, "speed": 1.5}
        }
        
        stats = troop_stats.get(troop_type, {})
        self.troop_counter += 1
        
        troop = {
            "id": f"mistral_{troop_type}_{self.troop_counter}",
            "type": troop_type,
            "team": "red",
            "row": row,
            "col": col,
            "health": stats.get("health", 1000),
            "maxHealth": stats.get("health", 1000),
            "damage": stats.get("damage", 100),
            "speed": stats.get("speed", 1.0),
            "isAlive": True,
            "deployTime": datetime.now().isoformat()
        }
        
        self.game_state["troops"].append(troop)
        
        return {
            "status": "Troupe déployée!",
            "troop": troop,
            "message": f"Mistral AI a déployé {troop_type} en position ({row}, {col})",
            "currentTroops": len(self.game_state["troops"])
        }

    async def get_game_state(self) -> Dict[str, Any]:
        """Récupère l'état complet du jeu"""
        red_troops = [t for t in self.game_state["troops"] if t["team"] == "red"]
        blue_troops = [t for t in self.game_state["troops"] if t["team"] == "blue"]
        
        return {
            "gameState": self.game_state,
            "analysis": {
                "totalTroops": len(self.game_state["troops"]),
                "mistralTroops": len(red_troops),
                "humanTroops": len(blue_troops),
                "activeTowers": len([t for t in self.game_state["towers"] if t["health"] > 0])
            }
        }

    async def analyze_battlefield(self) -> Dict[str, Any]:
        """Analyse tactique du champ de bataille"""
        red_troops = [t for t in self.game_state["troops"] if t["team"] == "red"]
        blue_troops = [t for t in self.game_state["troops"] if t["team"] == "blue"]
        
        analysis = {
            "situation": "Analyse tactique du champ de bataille",
            "mistralForces": {
                "count": len(red_troops),
                "types": list(set([t["type"] for t in red_troops])),
                "totalHealth": sum([t["health"] for t in red_troops])
            },
            "enemyForces": {
                "count": len(blue_troops),
                "types": list(set([t["type"] for t in blue_troops])),
                "totalHealth": sum([t["health"] for t in blue_troops])
            },
            "recommendation": self._get_tactical_recommendation(red_troops, blue_troops)
        }
        
        return analysis

    def _get_tactical_recommendation(self, red_troops: List, blue_troops: List) -> str:
        """Génère une recommandation tactique"""
        if not blue_troops:
            return "Aucune menace détectée. Préparez une attaque offensive."
        
        enemy_types = [t["type"] for t in blue_troops]
        
        if "giant" in enemy_types:
            return "Ennemi a des Giants (tanks). Recommandation: déployer Mini PEKKA pour les contrer."
        elif "babyDragon" in enemy_types:
            return "Ennemi a des Baby Dragons (volants). Recommandation: utiliser des troupes résistantes comme Valkyrie."
        elif "miniPekka" in enemy_types:
            return "Ennemi a des Mini PEKKA (haute attaque). Recommandation: utiliser des troupes avec plus de santé comme Giant."
        else:
            return "Situation équilibrée. Adaptez votre stratégie selon l'évolution."

    async def get_troop_stats(self, troop_type: str) -> Dict[str, Any]:
        """Récupère les stats d'une troupe"""
        stats = {
            "giant": {
                "name": "Giant",
                "health": 4416,
                "damage": 253,
                "speed": 1.2,
                "cost": 5,
                "description": "Tank haute santé, cible uniquement les bâtiments",
                "strategy": "Utilisez comme tank pour protéger d'autres troupes"
            },
            "babyDragon": {
                "name": "Baby Dragon",
                "health": 1152,
                "damage": 161,
                "speed": 2.0,
                "cost": 4,
                "description": "Unité volante, attaque air et sol",
                "strategy": "Excellente pour nettoyer les petites troupes"
            },
            "miniPekka": {
                "name": "Mini P.E.K.K.A",
                "health": 1361,
                "damage": 720,
                "speed": 1.8,
                "cost": 4,
                "description": "Haute attaque, cible le plus proche",
                "strategy": "Parfait contre les tanks et tours"
            },
            "valkyrie": {
                "name": "Valkyrie",
                "health": 1908,
                "damage": 267,
                "speed": 1.5,
                "cost": 4,
                "description": "Attaque en zone, efficace contre les groupes",
                "strategy": "Idéale contre les essaims de petites troupes"
            }
        }
        
        return stats.get(troop_type, {"error": "Type de troupe inconnu"})

    async def suggest_counter(self, enemy_troops: List[str]) -> Dict[str, Any]:
        """Suggère des contre-stratégies"""
        counters = {
            "giant": ["miniPekka", "valkyrie"],
            "babyDragon": ["valkyrie", "giant"],
            "miniPekka": ["giant", "valkyrie"],
            "valkyrie": ["babyDragon", "miniPekka"]
        }
        
        suggestions = []
        for enemy in enemy_troops:
            if enemy in counters:
                suggestions.extend(counters[enemy])
        
        # Enlever les doublons
        unique_suggestions = list(set(suggestions))
        
        return {
            "enemyTroops": enemy_troops,
            "recommendedCounters": unique_suggestions,
            "strategy": f"Pour contrer {', '.join(enemy_troops)}, utilisez: {', '.join(unique_suggestions)}"
        }

# Instance globale du serveur
game_server = ClashRoyaleMCPServer()

# Création du serveur MCP officiel
server = Server("clash-royale-mcp")

@server.list_tools()
async def list_tools() -> List[Tool]:
    """Liste tous les outils disponibles pour Mistral"""
    return [
        Tool(
            name="start_game",
            description="Démarre une nouvelle partie de Clash Royale",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="deploy_troop",
            description="Déploie une troupe sur le terrain (Mistral joue en équipe rouge)",
            inputSchema={
                "type": "object",
                "properties": {
                    "troopType": {
                        "type": "string",
                        "enum": ["giant", "babyDragon", "miniPekka", "valkyrie"],
                        "description": "Type de troupe à déployer"
                    },
                    "row": {
                        "type": "number",
                        "description": "Position ligne (0-15 pour équipe rouge de Mistral)"
                    },
                    "col": {
                        "type": "number",
                        "description": "Position colonne (0-17)"
                    }
                },
                "required": ["troopType", "row", "col"]
            }
        ),
        Tool(
            name="get_game_state",
            description="Récupère l'état actuel du jeu avec toutes les troupes et tours",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="analyze_battlefield",
            description="Analyse la situation tactique actuelle pour prendre des décisions stratégiques",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_troop_stats",
            description="Récupère les statistiques détaillées d'un type de troupe",
            inputSchema={
                "type": "object",
                "properties": {
                    "troopType": {
                        "type": "string",
                        "enum": ["giant", "babyDragon", "miniPekka", "valkyrie"]
                    }
                },
                "required": ["troopType"]
            }
        ),
        Tool(
            name="suggest_counter",
            description="Suggère une contre-stratégie basée sur les troupes ennemies",
            inputSchema={
                "type": "object",
                "properties": {
                    "enemyTroops": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Types de troupes ennemies à contrer"
                    }
                },
                "required": ["enemyTroops"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Exécute un outil demandé par Mistral"""
    try:
        if name == "start_game":
            result = await game_server.start_game()
            
        elif name == "deploy_troop":
            result = await game_server.deploy_troop(
                arguments["troopType"],
                arguments["row"], 
                arguments["col"]
            )
            
        elif name == "get_game_state":
            result = await game_server.get_game_state()
            
        elif name == "analyze_battlefield":
            result = await game_server.analyze_battlefield()
            
        elif name == "get_troop_stats":
            result = await game_server.get_troop_stats(arguments["troopType"])
            
        elif name == "suggest_counter":
            result = await game_server.suggest_counter(arguments["enemyTroops"])
            
        else:
            raise ValueError(f"Outil inconnu: {name}")

        return [TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "tool": name,
            "arguments": arguments
        }
        return [TextContent(type="text", text=json.dumps(error_result, indent=2, ensure_ascii=False))]

async def main():
    """Point d'entrée principal du serveur MCP"""
    logger.info("🎮 Clash Royale MCP Server started")
    
    async with stdio_server() as streams:
        await server.run(
            streams[0], streams[1], 
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())