# Railway deployment configuration for MCP Server

# Structure du dossier backend/ pour Railway:
backend/
├── mcp_stdio_server.py          # Serveur MCP principal
├── requirements.txt              # Dépendances Python
├── Procfile                      # Commande de démarrage
├── railway.json                  # Configuration Railway
└── mistral_config.json          # Config pour Mistral

# Le frontend reste sur Vercel
ui/ (déployé sur Vercel séparément)
