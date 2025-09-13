#!/usr/bin/env python3
"""
Client de test pour le serveur MCP Clash Royale
"""

import requests

BASE_URL = "http://localhost:8000"

def test_server_connection():
    """Test de connexion au serveur"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print("✅ Connexion au serveur:", response.json())
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        return False

def test_mcp_tools():
    """Test des outils MCP"""
    print("\n🔧 Test des outils MCP...")
    
    # Test liste des outils
    response = requests.get(f"{BASE_URL}/tools")
    tools = response.json()["tools"]
    print(f"📋 Outils disponibles: {len(tools)}")
    for tool in tools:
        print(f"   - {tool['name']}: {tool['description']}")
    
    # Test démarrage du jeu
    print("\n🎮 Démarrage du jeu...")
    response = requests.post(f"{BASE_URL}/tools/start_game", json={})
    print("Résultat:", response.json()["message"])
    
    # Test spawn d'un géant rouge
    print("\n🏗️  Spawn d'un géant rouge...")
    response = requests.post(f"{BASE_URL}/tools/spawn_troop", json={
        "troop_type": "giant",
        "team": "red",
        "row": 5,
        "col": 8
    })
    result = response.json()
    print("Géant créé:", result["troop_id"])
    giant_id = result["troop_id"]
    
    # Test spawn d'un dragon bleu
    print("\n🐲 Spawn d'un dragon bleu...")
    response = requests.post(f"{BASE_URL}/tools/spawn_troop", json={
        "troop_type": "babyDragon",
        "team": "blue",
        "row": 28,
        "col": 10
    })
    result = response.json()
    print("Dragon créé:", result["troop_id"])
    dragon_id = result["troop_id"]
    
    # Test récupération des troupes
    print("\n📊 Récupération des troupes...")
    response = requests.post(f"{BASE_URL}/tools/get_all_troops", json={})
    troops = response.json()["troops"]
    print(f"Troupes total: {len(troops)}")
    
    # Test dégâts sur le géant
    print(f"\n⚔️  Attaque du géant {giant_id}...")
    response = requests.post(f"{BASE_URL}/tools/damage_troop", json={
        "troop_id": giant_id,
        "damage": 500
    })
    result = response.json()
    print(f"Dégâts infligés: {result['damage_dealt']}, Vie restante: {result['remaining_health']}")
    
    # Test récupération des tours
    print("\n🏰 Récupération des tours...")
    response = requests.post(f"{BASE_URL}/tools/get_all_towers", json={})
    towers = response.json()["towers"]
    print(f"Tours total: {len(towers)}")
    
    # Test attaque d'une tour
    king_red_id = "king_red"
    print(f"\n💥 Attaque de la tour {king_red_id}...")
    response = requests.post(f"{BASE_URL}/tools/damage_tower", json={
        "tower_id": king_red_id,
        "damage": 1000
    })
    result = response.json()
    print(f"Dégâts infligés: {result['damage_dealt']}, Vie restante: {result['remaining_health']}")
    
    # Test statistiques
    print("\n📈 Statistiques du jeu...")
    response = requests.post(f"{BASE_URL}/tools/get_game_stats", json={})
    stats = response.json()
    print(f"Troupes vivantes: {stats['living_troops']}/{stats['total_troops']}")
    print(f"Tours actives: {stats['active_towers']}/{stats['total_towers']}")

def main():
    """Fonction principale de test"""
    print("🧪 Test du serveur MCP Clash Royale")
    print("=" * 50)
    
    if not test_server_connection():
        print("\n💡 Assurez-vous que le serveur est démarré avec: python run_server.py")
        return
    
    test_mcp_tools()
    
    print("\n✅ Tests terminés avec succès!")

if __name__ == "__main__":
    main()