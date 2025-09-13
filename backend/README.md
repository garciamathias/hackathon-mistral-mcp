# Clash Royale MCP Server

Serveur MCP pour le jeu Clash Royale, compatible avec Mistral AI et autres LLMs.

## 🎮 Fonctionnalités

- **Déploiement de troupes** : Giant, Baby Dragon, Mini PEKKA, Valkyrie
- **Analyse tactique** : Évaluation de la situation de bataille
- **Stratégies de contre-attaque** : Suggestions basées sur les troupes ennemies
- **État du jeu** : Synchronisation temps réel des troupes et tours

## 🛠️ Outils MCP disponibles

- `start_game` : Démarrer une nouvelle partie
- `deploy_troop` : Déployer une troupe sur le terrain
- `get_game_state` : Récupérer l'état actuel du jeu
- `analyze_battlefield` : Analyser la situation tactique
- `get_troop_stats` : Statistiques détaillées des troupes
- `suggest_counter` : Suggérer des contre-stratégies

## 🚀 Déploiement

Ce serveur est optimisé pour le déploiement sur Alpic.ai :

1. **STDIO natif** : Communication directe avec les LLMs
2. **Transport abstraction** : Support automatique SSE/WebSocket
3. **Monitoring intégré** : Métriques MCP spécifiques
4. **Scalabilité** : Infrastructure serverless distribuée

## 🎯 Utilisation avec Mistral AI

```python
from mistralai import MistralClient
from mistralai.client import MCPClientSSE

# Configuration Mistral
client = MistralClient(api_key="your-api-key")
mcp_client = MCPClientSSE(
    server_url="https://your-app.alpic.ai/sse",
    client=client
)

# Utilisation
response = await mcp_client.call_tool(
    "deploy_troop",
    {"troopType": "giant", "row": 14, "col": 9}
)
```

## 📊 Statistiques des troupes

| Troupe | Santé | Dégâts | Vitesse | Coût | Description |
|--------|-------|--------|---------|------|-------------|
| Giant | 4416 | 253 | 1.2 | 5 | Tank haute santé |
| Baby Dragon | 1152 | 161 | 2.0 | 4 | Unité volante |
| Mini PEKKA | 1361 | 720 | 1.8 | 4 | Haute attaque |
| Valkyrie | 1908 | 267 | 1.5 | 4 | Attaque en zone |

## 🔧 Développement local

```bash
# Installation
pip install -r requirements.txt

# Test
python test_mistral_mcp.py

# Démarrage serveur
python mcp_stdio_server.py
```

## 📈 Monitoring

Alpic.ai fournit des métriques spécifiques MCP :
- Sessions actives
- Appels d'outils par minute
- Latence des réponses
- Taux d'erreur
- Utilisation des tokens