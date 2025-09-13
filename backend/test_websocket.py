#!/usr/bin/env python3
"""
Test du WebSocket pour vérifier la communication Humain vs Mistral AI
"""

import asyncio
import websockets
import json
from datetime import datetime

class WebSocketTester:
    def __init__(self, server_url="ws://localhost:8000/ws"):
        self.server_url = server_url
        self.websocket = None

    async def connect_and_test(self):
        """Test complet de la connexion WebSocket"""
        try:
            print(f"🔌 Connexion à {self.server_url}...")
            
            async with websockets.connect(self.server_url) as websocket:
                self.websocket = websocket
                print("✅ Connecté au serveur MCP!")
                
                # Test 1: Démarrer une partie
                await self.test_game_start()
                
                # Test 2: Déployer une troupe humaine
                await self.test_human_troop_deployment()
                
                # Test 3: Écouter la réponse de Mistral
                await self.listen_for_mistral_response()
                
        except Exception as e:
            print(f"❌ Erreur de connexion: {e}")

    async def test_game_start(self):
        """Test du démarrage de partie"""
        print("\n🎮 Test: Démarrage de partie...")
        
        start_action = {
            "type": "GAME_START",
            "payload": {
                "playerId": "test_human",
                "playerType": "human"
            },
            "playerId": "test_human",
            "timestamp": datetime.now().isoformat()
        }
        
        await self.websocket.send(json.dumps(start_action))
        
        # Attendre la confirmation
        response = await self.websocket.recv()
        data = json.loads(response)
        print(f"📨 Réponse serveur: {data.get('type', 'Unknown')}")
        print(f"   Payload: {data.get('payload', {})}")

    async def test_human_troop_deployment(self):
        """Test du déploiement d'une troupe par l'humain"""
        print("\n🏗️  Test: Déploiement troupe humaine (Giant)...")
        
        spawn_action = {
            "type": "SPAWN_TROOP",
            "payload": {
                "troopType": "giant",
                "row": 20,
                "col": 9,
                "team": "blue"
            },
            "playerId": "test_human",
            "timestamp": datetime.now().isoformat()
        }
        
        await self.websocket.send(json.dumps(spawn_action))
        print("✅ Action envoyée, en attente de la réponse de Mistral...")

    async def listen_for_mistral_response(self):
        """Écoute la réponse de Mistral AI"""
        print("\n🤖 En attente de la réponse de Mistral AI...")
        
        try:
            # Attendre la réponse avec timeout
            response = await asyncio.wait_for(self.websocket.recv(), timeout=10.0)
            data = json.loads(response)
            
            if data.get('type') == 'MISTRAL_MOVE':
                payload = data.get('payload', {})
                print(f"🎯 Mistral AI a joué!")
                print(f"   Troupe: {payload.get('troopType')}")
                print(f"   Position: ({payload.get('row')}, {payload.get('col')})")
                print(f"   Équipe: {payload.get('team')}")
                print(f"   Stratégie: {payload.get('reasoning')}")
            else:
                print(f"📨 Autre message reçu: {data.get('type')}")
                
        except asyncio.TimeoutError:
            print("⏰ Timeout - Mistral AI n'a pas répondu dans les temps")
        except Exception as e:
            print(f"❌ Erreur lors de l'écoute: {e}")

async def test_server_status():
    """Test du status du serveur via HTTP"""
    import aiohttp
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test API REST
            async with session.get("http://localhost:8000/") as response:
                data = await response.json()
                print("🌐 Serveur HTTP:", data.get("message", "OK"))
            
            # Test status WebSocket
            async with session.get("http://localhost:8000/ws/status") as response:
                data = await response.json()
                print(f"🔌 Sessions WebSocket actives: {data.get('active_sessions', 0)}")
                
    except Exception as e:
        print(f"❌ Erreur HTTP: {e}")

async def main():
    """Test principal"""
    print("🧪 Test du serveur MCP WebSocket")
    print("=" * 50)
    
    # Test 1: Status serveur
    await test_server_status()
    
    # Test 2: WebSocket
    tester = WebSocketTester()
    await tester.connect_and_test()
    
    print("\n✅ Tests terminés!")

if __name__ == "__main__":
    asyncio.run(main())
