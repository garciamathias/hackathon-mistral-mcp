#!/usr/bin/env python3
"""
Test final de validation du serveur MCP Clash Royale
"""

import requests
import json
import time

def test_complete_workflow():
    """Teste un workflow complet pour valider toutes les corrections"""
    base_url = "http://localhost:3000"
    
    print("🎯 Test de workflow complet du serveur MCP")
    print("=" * 50)
    
    # Test 1: Démarrer le jeu
    print("\n1. Démarrage du jeu...")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "start_game",
                "arguments": {}
            }
        })
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Jeu démarré avec succès")
        else:
            print(f"❌ Erreur: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False
    
    # Test 2: Déployer plusieurs troupes
    print("\n2. Déploiement de troupes...")
    troops_to_deploy = [
        {"troopType": "giant", "row": 10, "col": 5, "team": "blue"},
        {"troopType": "babyDragon", "row": 15, "col": 8, "team": "red"},
        {"troopType": "miniPekka", "row": 20, "col": 3, "team": "blue"},
        {"troopType": "valkyrie", "row": 25, "col": 12, "team": "red"}
    ]
    
    for i, troop in enumerate(troops_to_deploy):
        try:
            response = requests.post(f"{base_url}/api/mcp/tools", json={
                "method": "tools/call",
                "params": {
                    "name": "deploy_troop",
                    "arguments": troop
                }
            })
            print(f"✅ Troupe {i+1} ({troop['troopType']}): Status {response.status_code}")
            if response.status_code != 200:
                print(f"❌ Erreur: {response.text}")
        except Exception as e:
            print(f"❌ Erreur pour troupe {i+1}: {e}")
    
    # Test 3: Récupérer l'état du jeu
    print("\n3. Récupération de l'état du jeu...")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "get_game_state",
                "arguments": {}
            }
        })
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            troops_data = json.loads(data['content'][0]['text'])
            print(f"✅ Nombre de troupes: {len(troops_data['troops'])}")
            print(f"✅ Jeu en cours: {troops_data['gameStats']['isRunning']}")
        else:
            print(f"❌ Erreur: {response.text}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 4: Analyser une stratégie
    print("\n4. Analyse de stratégie...")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/call",
            "params": {
                "name": "analyze_strategy",
                "arguments": {
                    "situation": "L'équipe bleue a déployé un géant et un mini-pekka, l'équipe rouge a un bébé dragon et une valkyrie"
                }
            }
        })
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            analysis = json.loads(data['content'][0]['text'])
            print(f"✅ Analyse terminée: {analysis['recommendation']}")
        else:
            print(f"❌ Erreur: {response.text}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 5: Test de validation des erreurs
    print("\n5. Test de validation des erreurs...")
    error_tests = [
        {
            "name": "deploy_troop",
            "args": {"troopType": "invalid_troop", "row": 10, "col": 5, "team": "blue"},
            "expected_error": "Invalid troopType"
        },
        {
            "name": "deploy_troop", 
            "args": {"troopType": "giant", "row": 50, "col": 5, "team": "blue"},
            "expected_error": "Invalid row"
        },
        {
            "name": "analyze_strategy",
            "args": {},
            "expected_error": "Situation parameter is required"
        }
    ]
    
    for test in error_tests:
        try:
            response = requests.post(f"{base_url}/api/mcp/tools", json={
                "method": "tools/call",
                "params": {
                    "name": test["name"],
                    "arguments": test["args"]
                }
            })
            if response.status_code == 500:
                error_text = response.json().get('error', '')
                if test["expected_error"] in error_text:
                    print(f"✅ Validation d'erreur réussie: {test['expected_error']}")
                else:
                    print(f"❌ Erreur de validation: attendu '{test['expected_error']}', reçu '{error_text}'")
            else:
                print(f"❌ Erreur de validation: attendu status 500, reçu {response.status_code}")
        except Exception as e:
            print(f"❌ Erreur lors du test de validation: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Tests de workflow terminés!")

if __name__ == "__main__":
    test_complete_workflow()
