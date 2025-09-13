#!/usr/bin/env python3
"""
Test simple du serveur MCP pour vérifier qu'il démarre correctement
"""

import subprocess
import sys
import time

def test_server_startup():
    """Test que le serveur démarre sans erreur"""
    print("🧪 Test de démarrage du serveur MCP...")
    
    try:
        # Démarrer le serveur en arrière-plan
        process = subprocess.Popen(
            [sys.executable, "mcp_stdio_server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Attendre un peu pour voir s'il démarre
        time.sleep(2)
        
        # Vérifier que le processus est toujours en vie
        if process.poll() is None:
            print("✅ Serveur MCP démarré avec succès")
            print("✅ Processus actif (PID:", process.pid, ")")
            
            # Arrêter le serveur
            process.terminate()
            process.wait()
            print("🛑 Serveur arrêté proprement")
            return True
        else:
            print("❌ Serveur MCP s'est arrêté prématurément")
            stdout, stderr = process.communicate()
            print("STDOUT:", stdout)
            print("STDERR:", stderr)
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_import():
    """Test que les imports fonctionnent"""
    print("\n🔧 Test des imports MCP...")
    
    try:
        import mcp
        print("✅ Import mcp réussi")
        
        from mcp.server import Server
        print("✅ Import Server réussi")
        
        from mcp.server.stdio import stdio_server
        print("✅ Import stdio_server réussi")
        
        from mcp.types import Tool, TextContent
        print("✅ Import types réussi")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        return False

def test_server_creation():
    """Test que le serveur peut être créé"""
    print("\n🏗️  Test de création du serveur...")
    
    try:
        from mcp.server import Server
        server = Server("test-server")
        print("✅ Serveur créé avec succès")
        return True
        
    except Exception as e:
        print(f"❌ Erreur de création: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Tests du serveur MCP Clash Royale")
    print("=" * 50)
    
    tests = [
        test_import,
        test_server_creation,
        test_server_startup
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n📊 Résultats: {passed}/{len(tests)} tests réussis")
    
    if passed == len(tests):
        print("🎉 Tous les tests sont passés! Le serveur est prêt pour Alpic.ai")
    else:
        print("❌ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")