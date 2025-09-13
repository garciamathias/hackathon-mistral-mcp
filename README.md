# MCP-HACKTHON - Clash Royale Game

Projet de hackathon MCP : Jeu Clash Royale avec IA Mistral comme adversaire.

## 🎮 Structure du projet

```
MCP-HACKTHON/
├── mcp_stdio_server.py          # Serveur MCP pour Mistral AI
├── requirements.txt              # Dépendances Python
├── test_mistral_mcp.py          # Test du serveur MCP
├── README_MCP.md                # Documentation MCP détaillée
├── ui/                          # Interface web Next.js
│   ├── src/
│   ├── public/
│   └── package.json
└── backend/                     # Ancien dossier (à supprimer)
```

## 🚀 Déploiement

### Frontend (Vercel)
- **URL**: https://mcp-hackthon.vercel.app/
- **Dossier**: `ui/`
- **Type**: Next.js React

### Backend MCP (Alpic.ai)
- **Dossier**: Racine du projet (ce dossier)
- **Fichier principal**: `mcp_stdio_server.py`
- **Type**: Serveur MCP STDIO

## 🎯 Fonctionnalités

- **Jeu Clash Royale** : Interface web jouable
- **IA Mistral** : Adversaire intelligent via MCP
- **Troupes** : Giant, Baby Dragon, Mini PEKKA, Valkyrie
- **Stratégies** : Analyse tactique et contre-attaques

## 🛠️ Développement local

```bash
# Test du serveur MCP
python test_mistral_mcp.py

# Démarrage du serveur MCP
python mcp_stdio_server.py

# Interface web
cd ui/
npm install
npm run dev
```

## 📊 Outils MCP disponibles

- `start_game` : Démarrer une partie
- `deploy_troop` : Déployer une troupe
- `get_game_state` : État du jeu
- `analyze_battlefield` : Analyse tactique
- `get_troop_stats` : Statistiques des troupes
- `suggest_counter` : Contre-stratégies
