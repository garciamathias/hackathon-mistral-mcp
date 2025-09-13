#!/usr/bin/env python3
"""
Test du serveur MCP officiel pour Mistral AI
Utilise le SDK MCP officiel
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
        print("🎮 Serveur MCP officiel démarré")

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

    async def test_mcp_server(self):
        """Test du serveur MCP officiel"""
        print("🧪 Test du serveur MCP officiel")
        print("=" * 50)

        try:
            # Test 1: Initialisation
            print("\n🔧 Test 1: Initialisation MCP...")
            init_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {
                        "name": "test-client",
                        "version": "1.0.0"
                    }
                }
            }
            
            self.process.stdin.write(json.dumps(init_request) + "\n")
            self.process.stdin.flush()
            
            response_line = self.process.stdout.readline()
            if response_line:
                response = json.loads(response_line.strip())
                print(f"✅ Initialisation: {response.get('result', {}).get('serverInfo', {}).get('name', 'Unknown')}")

            # Test 2: Lister les outils
            print("\n📋 Test 2: Lister les outils MCP...")
            response = await self.send_request("tools/list")
            tools = response.get("tools", [])
            print(f"✅ {len(tools)} outils disponibles:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")

            # Test 3: Démarrer une partie
            print("\n🎮 Test 3: Démarrer une partie...")
            response = await self.send_request("tools/call", {
                "name": "start_game",
                "arguments": {}
            })
            print("✅ Partie démarrée:")
            if "content" in response:
                content = json.loads(response["content"][0]["text"])
                print(f"   Status: {content.get('status')}")

            # Test 4: Déployer une troupe
            print("\n🏗️  Test 4: Mistral déploie un Giant...")
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

            # Test 5: Analyser le champ de bataille
            print("\n🔍 Test 5: Analyser la situation...")
            response = await self.send_request("tools/call", {
                "name": "analyze_battlefield",
                "arguments": {}
            })
            if "content" in response:
                analysis = json.loads(response["content"][0]["text"])
                print(f"✅ Analyse: {analysis.get('recommendation')}")

            print("\n🎉 Tests du serveur MCP officiel réussis!")

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
        await tester.test_mcp_server()
    finally:
        await tester.stop_server()

if __name__ == "__main__":
    asyncio.run(main())