#!/usr/bin/env python3
"""
Script de test pour diagnostiquer le serveur MCP Clash Royale
"""

import requests
import json
import sys
from typing import Dict, Any

class MCPTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.mcp_endpoint = f"{base_url}/api/mcp/tools"
    
    def test_server_connection(self) -> bool:
        """Teste la connexion au serveur"""
        try:
            print("🔍 Test de connexion au serveur...")
            response = requests.get(f"{self.base_url}/api/mcp/tools", timeout=5)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur de connexion: {e}")
            return False
    
    def test_tools_list(self) -> Dict[str, Any]:
        """Teste la récupération de la liste des outils"""
        try:
            print("\n🔧 Test de la liste des outils...")
            payload = {
                "method": "tools/list",
                "params": {}
            }
            response = requests.post(self.mcp_endpoint, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur lors du test des outils: {e}")
            return {"error": str(e)}
    
    def test_start_game(self) -> Dict[str, Any]:
        """Teste l'outil start_game"""
        try:
            print("\n🎮 Test de l'outil start_game...")
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "start_game",
                    "arguments": {}
                }
            }
            response = requests.post(self.mcp_endpoint, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur lors du test start_game: {e}")
            return {"error": str(e)}
    
    def test_deploy_troop(self) -> Dict[str, Any]:
        """Teste l'outil deploy_troop"""
        try:
            print("\n⚔️ Test de l'outil deploy_troop...")
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "deploy_troop",
                    "arguments": {
                        "troopType": "giant",
                        "row": 10,
                        "col": 5,
                        "team": "blue"
                    }
                }
            }
            response = requests.post(self.mcp_endpoint, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur lors du test deploy_troop: {e}")
            return {"error": str(e)}
    
    def test_get_game_state(self) -> Dict[str, Any]:
        """Teste l'outil get_game_state"""
        try:
            print("\n📊 Test de l'outil get_game_state...")
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "get_game_state",
                    "arguments": {}
                }
            }
            response = requests.post(self.mcp_endpoint, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur lors du test get_game_state: {e}")
            return {"error": str(e)}
    
    def run_all_tests(self):
        """Exécute tous les tests"""
        print("🚀 Démarrage des tests MCP Clash Royale")
        print("=" * 50)
        
        # Test 1: Connexion
        if not self.test_server_connection():
            print("❌ Le serveur n'est pas accessible. Vérifiez qu'il est démarré.")
            return
        
        # Test 2: Liste des outils
        tools_result = self.test_tools_list()
        if "error" in tools_result:
            print(f"❌ Erreur lors de la récupération des outils: {tools_result['error']}")
            return
        
        # Test 3: Start game
        start_result = self.test_start_game()
        if "error" in start_result:
            print(f"❌ Erreur lors du démarrage du jeu: {start_result['error']}")
        
        # Test 4: Deploy troop
        deploy_result = self.test_deploy_troop()
        if "error" in deploy_result:
            print(f"❌ Erreur lors du déploiement de troupe: {deploy_result['error']}")
        
        # Test 5: Get game state
        state_result = self.test_get_game_state()
        if "error" in state_result:
            print(f"❌ Erreur lors de la récupération de l'état: {state_result['error']}")
        
        print("\n" + "=" * 50)
        print("✅ Tests terminés")

def main():
    """Fonction principale"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:3000"
    
    print(f"🌐 Test du serveur MCP à l'adresse: {base_url}")
    
    tester = MCPTester(base_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()
