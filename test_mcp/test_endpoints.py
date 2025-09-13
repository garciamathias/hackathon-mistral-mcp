#!/usr/bin/env python3
"""
Test spécifique pour diagnostiquer le problème d'endpoint MCP
"""

import requests
import json

def test_endpoints():
    """Teste différents endpoints pour identifier le problème"""
    base_url = "http://localhost:3000"
    
    # Test 1: Endpoint correct (celui qui fonctionne)
    print("🔍 Test de l'endpoint correct: /api/mcp/tools")
    try:
        response = requests.post(f"{base_url}/api/mcp/tools", json={
            "method": "tools/list",
            "params": {}
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 2: Endpoint incorrect mentionné dans la réponse GET
    print("\n🔍 Test de l'endpoint incorrect: /api/mcp/call_tool")
    try:
        response = requests.post(f"{base_url}/api/mcp/call_tool", json={
            "method": "tools/list",
            "params": {}
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 3: Vérification de la structure de l'URL
    print("\n🔍 Test de la structure de l'URL avec différents transports")
    transports = ["tools", "call_tool", "mcp", "api"]
    
    for transport in transports:
        try:
            response = requests.post(f"{base_url}/api/mcp/{transport}", json={
                "method": "tools/list",
                "params": {}
            })
            print(f"Transport '{transport}': Status {response.status_code}")
            if response.status_code == 200:
                print(f"  ✅ Fonctionne!")
            else:
                print(f"  ❌ Erreur: {response.text[:100]}")
        except Exception as e:
            print(f"Transport '{transport}': Erreur {e}")

if __name__ == "__main__":
    test_endpoints()
