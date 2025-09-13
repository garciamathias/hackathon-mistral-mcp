# Instructions de test pour le jeu Clash Royale AI

## ✅ Corrections appliquées

1. **Structure des données des troupes corrigée** dans ServerSyncEngine
2. **Méthodes problématiques overridées** pour éviter les conflits
3. **Vérifications de sécurité ajoutées** dans GameEngine
4. **Conversion des noms de troupes** (camelCase → UPPER_SNAKE_CASE)
5. **Logging complet ajouté** pour débugger le polling et l'affichage
6. **Mouvement des troupes activé** - Les troupes bougent maintenant localement
7. **Synchronisation intelligente** - Merge des troupes serveur/client au lieu de remplacer

## 🚀 Pour tester le jeu

### 1. Démarrer le serveur Python MCP

```bash
cd mcp-server
python server.py
```

Vous devriez voir dans la console :
- Le serveur démarrer sur le port 8000
- Des logs détaillés quand vous essayez de spawner des troupes

### 2. Démarrer le frontend Next.js

Dans un nouveau terminal :

```bash
cd ui
npm run dev
```

### 3. Ouvrir le jeu

Allez sur : `http://localhost:3000/arena/ai-mode`

### 4. Tester le spawn de troupes

**Deux méthodes possibles :**

1. **Click simple** : Cliquez sur une carte en bas → la troupe apparaît à la position par défaut (row 25, col 8)

2. **Drag & Drop** :
   - Glissez une carte depuis le bas
   - Déposez-la dans votre moitié du terrain (partie basse, rows 17-33)

### 📝 Vérifications dans les consoles

**Console du navigateur (F12)** - Nouveau logging ajouté :
- `🔄 Starting server sync polling` - Le polling a démarré
- `⏰ Polling server for updates...` - Chaque poll (toutes les 500ms)
- `📦 Received server state` - État reçu du serveur avec nombre de troupes
- `🔄 updateLocalState called` - Mise à jour de l'état local
- `🆕 New troop from server` - Nouvelle troupe détectée du serveur
- `🎮 Spawned new troop locally` - Troupe créée localement avec logique de mouvement
- `📝 Updated existing troop` - Mise à jour de la santé d'une troupe existante
- `✅ Total troops in map: X` - Nombre total de troupes
- `🔄 Received troops update from engine` - Troupes reçues par le composant
- `🎯 Current troops state in render` - État des troupes au moment du rendu
- `Rendering troop` - Détails de chaque troupe rendue

**Terminal Next.js** :
- `=== SPAWN REQUEST TO PYTHON SERVER ===`
- La réponse du serveur Python

**Terminal Python** :
- `=== SPAWN REQUEST RECEIVED ===`
- Détails de validation (élixir, position, etc.)
- `✅ Successfully spawned` si tout est OK

### 🎮 Règles du jeu

- **Vous êtes l'équipe BLEUE** (tours bleues en bas)
- **L'IA (Mistral) est l'équipe ROUGE** (tours rouges en haut)
- Vous ne pouvez spawner que dans votre moitié (rows 17-33)
- Chaque troupe coûte de l'élixir (3-5 points)
- L'élixir se régénère automatiquement
- **Les troupes bougent maintenant !** Elles vont automatiquement vers les tours ennemies

### ❌ Si ça ne marche pas

1. **Erreur ECONNREFUSED** → Le serveur Python n'est pas lancé
2. **Erreur de format de troupe** → Vérifiez que la conversion fonctionne
3. **Erreur de position** → Spawner uniquement dans la moitié basse (rows 17-33)
4. **Pas assez d'élixir** → Attendez que l'élixir se régénère

### 🔍 Débugger l'affichage des troupes

Si les troupes ne s'affichent pas, vérifiez dans la console :

1. **Le polling fonctionne ?**
   - Vous devez voir `⏰ Polling server for updates...` toutes les 500ms
   - Si non → Le polling n'a pas démarré

2. **Le serveur renvoie des troupes ?**
   - Cherchez `📦 Received server state`
   - Vérifiez `troopCount: X` (doit être > 0 après spawn)
   - Si 0 → Le serveur ne stocke pas les troupes

3. **Les troupes sont ajoutées à la map ?**
   - Cherchez `🎮 Adding troop to map`
   - Vérifiez `✅ Total troops in map: X`
   - Si 0 → Problème de conversion des données

4. **L'UI reçoit les troupes ?**
   - Cherchez `🔄 Received troops update from engine`
   - Vérifiez `count: X` (doit être > 0)
   - Si 0 → Le callback n'est pas appelé

5. **Les troupes sont dans le state React ?**
   - Cherchez `🎯 Current troops state in render`
   - Si vide → Le setState ne fonctionne pas

6. **Les troupes sont rendues ?**
   - Cherchez `Rendering troop`
   - Si absent → Les troupes ne passent pas le filtre de position

## 🔄 Pour relancer après modifications

1. Arrêtez les serveurs (Ctrl+C)
2. Relancez le serveur Python
3. Relancez le frontend
4. Rafraîchissez la page du navigateur