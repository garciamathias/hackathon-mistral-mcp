#!/usr/bin/env python3
"""
Test du serveur MCP STDIO pour Mistral AI
Simule les interactions que Mistral aurait avec le serveur
"""

import asyncio
import json
import subprocess
import sys
from typing import Dict, Any

class MistralMCPTester:
    def __init__(self, server_script="mcp_stdio_server.py"):
        self.server_script = server_script
        self.process = None

    async def start_server(self):
        """Démarre le serveur MCP en subprocess"""
        self.process = subprocess.Popen(
            [sys.executable, self.server_script],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0
        )
        print("🎮 Serveur MCP STDIO démarré")

    async def send_request(self, method: str, params: Dict[str, Any] = None, request_id: int = 1) -> Dict[str, Any]:
        """Envoie une requête au serveur MCP"""
        if not self.process:
            raise RuntimeError("Serveur non démarré")

        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method
        }
        
        if params:
            request["params"] = params

        # Envoyer la requête
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json)
        self.process.stdin.flush()

        # Lire la réponse
        response_line = self.process.stdout.readline()
        if response_line:
            return json.loads(response_line.strip())
        else:
            raise RuntimeError("Pas de réponse du serveur")

    async def test_full_game_scenario(self):
        """Test d'un scénario complet de jeu"""
        print("🧪 Test du scénario complet Mistral vs Humain")
        print("=" * 60)

        try:
            # Test 1: Lister les outils disponibles
            print("\n📋 Test 1: Lister les outils MCP...")
            response = await self.send_request("tools/list")
            tools = response.get("tools", [])
            print(f"✅ {len(tools)} outils disponibles:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")

            # Test 2: Démarrer une partie
            print("\n🎮 Test 2: Démarrer une partie...")
            response = await self.send_request("tools/call", {
                "name": "start_game",
                "arguments": {}
            })
            print("✅ Partie démarrée:")
            if "content" in response:
                content = json.loads(response["content"][0]["text"])
                print(f"   Status: {content.get('status')}")

            # Test 3: Analyser le champ de bataille
            print("\n🔍 Test 3: Analyser la situation...")
            response = await self.send_request("tools/call", {
                "name": "analyze_battlefield",
                "arguments": {}
            })
            if "content" in response:
                analysis = json.loads(response["content"][0]["text"])
                print(f"✅ Analyse: {analysis.get('recommendation')}")

            # Test 4: Obtenir les stats d'une troupe
            print("\n📊 Test 4: Stats du Giant...")
            response = await self.send_request("tools/call", {
                "name": "get_troop_stats",
                "arguments": {"troopType": "giant"}
            })
            if "content" in response:
                stats = json.loads(response["content"][0]["text"])
                print(f"✅ Giant: {stats.get('health')} HP, {stats.get('damage')} DMG")

            # Test 5: Déployer une troupe (Mistral joue)
            print("\n🏗️  Test 5: Mistral déploie un Giant...")
            response = await self.send_request("tools/call", {
                "name": "deploy_troop",
                "arguments": {
                    "troopType": "giant",
                    "row": 14,
                    "col": 9
                }
            })
            if "content" in response:
                deployment = json.loads(response["content"][0]["text"])
                print(f"✅ Déploiement: {deployment.get('message')}")

            # Test 6: Suggérer des contre-attaques
            print("\n⚔️  Test 6: Suggérer contre-attaque...")
            response = await self.send_request("tools/call", {
                "name": "suggest_counter",
                "arguments": {
                    "enemyTroops": ["babyDragon", "miniPekka"]
                }
            })
            if "content" in response:
                counter = json.loads(response["content"][0]["text"])
                print(f"✅ Contre-stratégie: {counter.get('strategy')}")

            # Test 7: État final du jeu
            print("\n🎯 Test 7: État final du jeu...")
            response = await self.send_request("tools/call", {
                "name": "get_game_state",
                "arguments": {}
            })
            if "content" in response:
                state = json.loads(response["content"][0]["text"])
                analysis = state.get("analysis", {})
                print(f"✅ Troupes totales: {analysis.get('totalTroops')}")
                print(f"   Troupes Mistral: {analysis.get('mistralTroops')}")
                print(f"   Troupes Humain: {analysis.get('humanTroops')}")

            print("\n🎉 Tous les tests réussis!")

        except Exception as e:
            print(f"❌ Erreur lors des tests: {e}")

    async def stop_server(self):
        """Arrête le serveur"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            print("🛑 Serveur arrêté")

async def main():
    """Test principal"""
    tester = MistralMCPTester()
    
    try:
        await tester.start_server()
        await asyncio.sleep(1)  # Laisser le serveur démarrer
        await tester.test_full_game_scenario()
    finally:
        await tester.stop_server()

if __name__ == "__main__":
    asyncio.run(main())
