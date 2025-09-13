#!/usr/bin/env python3
"""
Test approfondi pour reproduire l'erreur 3900
"""

import requests
import json
import time

def test_error_scenarios():
    """Teste différents scénarios qui pourraient causer l'erreur 3900"""
    base_url = "http://localhost:3000"
    
    print("🔍 Test des scénarios d'erreur potentiels")
    print("=" * 50)
    
    # Test 1: Requête malformée
    print("\n1. Test avec requête malformée")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", 
                               data="invalid json", 
                               headers={"Content-Type": "application/json"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 2: Méthode inexistante
    print("\n2. Test avec méthode inexistante")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "unknown_method",
            "params": {}
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 3: Arguments manquants pour deploy_troop
    print("\n3. Test deploy_troop avec arguments manquants")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "deploy_troop",
                "arguments": {
                    "troopType": "giant"
                    # Manque row, col, team
                }
            }
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 4: Arguments invalides pour deploy_troop
    print("\n4. Test deploy_troop avec arguments invalides")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "deploy_troop",
                "arguments": {
                    "troopType": "invalid_troop",
                    "row": "not_a_number",
                    "col": 5,
                    "team": "invalid_team"
                }
            }
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 5: Outil inexistant
    print("\n5. Test avec outil inexistant")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "unknown_tool",
                "arguments": {}
            }
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 6: Stress test - plusieurs requêtes rapides
    print("\n6. Test de stress - requêtes multiples rapides")
    try:
        for i in range(5):
            response = requests.post(f"{base_url}/api/mcp/tools", json={
                "method": "tools/call",
                "params": {
                    "name": "start_game",
                    "arguments": {}
                }
            })
            print(f"Requête {i+1}: Status {response.status_code}")
            if response.status_code != 200:
                print(f"  Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 7: Test avec analyse_strategy sans situation
    print("\n7. Test analyze_strategy sans situation")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "analyze_strategy",
                "arguments": {}
            }
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    test_error_scenarios()
