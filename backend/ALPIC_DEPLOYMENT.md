# Déploiement Alpic.ai - Clash Royale MCP Server

## 🚀 Structure finale du projet
```
backend/
├── mcp_stdio_server.py          # Serveur MCP principal (STDIO)
├── requirements.txt              # Dépendances minimales
├── README.md                     # Documentation complète
├── test_mistral_mcp.py          # Test du serveur MCP
└── ALPIC_DEPLOYMENT.md          # Ce fichier
```

## ✅ Avantages Alpic.ai
- **Spécialisé MCP** : Plateforme dédiée aux serveurs MCP
- **Déploiement simple** : One-click depuis GitHub
- **Monitoring natif** : Métriques MCP spécifiques
- **Transport abstraction** : STDIO → SSE/WebSocket automatique
- **Gratuit** : Pas de crédits à gérer

## 🎯 Configuration Mistral
Une fois déployé sur Alpic.ai :
- URL: `https://your-app.alpic.ai/sse`
- Type: `MCPClientSSE` (Remote MCP Server)
- Auth: Non requise pour commencer

## 📋 Étapes de déploiement
1. Push vers GitHub
2. Connecter repo sur alpic.ai
3. Sélectionner dossier `backend/`
4. One-click deployment ✨
