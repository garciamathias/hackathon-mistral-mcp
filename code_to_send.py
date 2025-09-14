# code_to_send.py


import os
import re

def concat_files_to_txt(file_list, output_path="code_to_send.txt"):
    """
    Concatène le contenu d'une liste de fichiers dans un seul fichier texte.

    Args:
        file_list (list of str): Liste des chemins des fichiers à concaténer.
        output_path (str): Chemin du fichier de sortie.
    """
    with open(output_path, "w", encoding="utf-8") as outfile:
        for file_path in file_list:
            if not os.path.isfile(file_path):
                print(f"[WARN] Fichier non trouvé : {file_path}")
                continue
            outfile.write(f"\n# ====== {file_path} ======\n")
            with open(file_path, "r", encoding="utf-8") as infile:
                # remove content between triple quotes (both """...""" and '''...''')
                content = infile.read()
                content = re.sub(r'"""[\s\S]*?"""', '', content)
                content = re.sub(r"'''[\s\S]*?'''", '', content)
                outfile.write(content)
                outfile.write("\n")

    print(f"[INFO] Code concaténé dans {output_path}")

if __name__ == "__main__":
    # Exemple d'utilisation : à adapter selon vos besoins
    ui = [
        "ui/src/app/api/game/[id]/state/route.ts",
        "ui/src/app/api/game/init/route.ts",
        "ui/src/app/api/game/spawn/route.ts",

        "ui/src/app/api/match/create/route.ts",
        "ui/src/app/api/match/join/route.ts",
        "ui/src/app/api/match/list/route.ts",

        "ui/src/app/api/mcp/[transport]/route.ts",

        "ui/src/app/arena/page.tsx", 

        "ui/src/app/lobby/page.tsx",

        "ui/src/app/page.tsx",

        "ui/src/game/GameEngine.ts", 
        "ui/src/game/useGameEngine.ts", 

        "ui/src/hooks/useOnlineGame.ts",

        "ui/src/lib/gameStore.ts",
        "ui/src/lib/session.ts",
        "ui/src/lib/utils.ts",

        "ui/src/services/api.ts",
        "ui/src/services/gameClient.ts",
        "ui/src/services/websocket.ts",

        "ui/src/types/backend.ts",
    ]

    engine = [
        "engine/src/mcp/gameManager.ts",
        "engine/src/mcp/mcpServer.ts",
        "engine/src/mcp/mcpServerNew.ts",
        "engine/src/mcp/protocol.ts",
        "engine/src/mcp/tools.ts",
        "engine/src/mcp/types.ts",
        "engine/src/server.ts",
        "engine/src/index.ts"
    ]

    concat_files_to_txt(ui, "code_to_send_ui.txt")
    concat_files_to_txt(engine, "code_to_send_engine.txt")
