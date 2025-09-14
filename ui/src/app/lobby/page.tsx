"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/services/api";

export default function Lobby() {
  const router = useRouter();
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinMatch = async () => {
    if (!matchId) {
      setError("Enter a Match ID");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.joinMatch(matchId);
      if (response) {
        sessionStorage.setItem("matchId", matchId);
        sessionStorage.setItem("isHost", "false");
        sessionStorage.setItem("playerTeam", response.team);
        if (response.playerState) {
          sessionStorage.setItem("playerId", response.playerState.id);
          sessionStorage.setItem("playerName", response.playerState.name);
        }
        router.push(`/${matchId}`);
      } else {
        setError("Failed to join match");
      }
    } catch {
      setError("Match full or not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage:
          "url('images/backgrounds/main_menu_background.png')", // damier bleu façon Supercell
        backgroundSize: "cover",
      }}
    >
      <Card className="p-8 bg-gradient-to-b from-blue-700 to-blue-900 border-4 border-blue-400 rounded-xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-6 drop-shadow supercell-font">
          Online Battle
        </h1>

        <div className="mb-6 text-sm">
          <Input
            type="text"
            placeholder="Enter Match ID"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="bg-blue-950/80 border-2 border-blue-400 text-white text-sm rounded-lg supercell-font"
          />
        </div>

        <Button
          onClick={handleJoinMatch}
          disabled={loading}
          className="w-full py-4 text-2xl font-bold text-black bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg shadow-[0_4px_0_0_#b58d00] hover:brightness-110 supercell-font"
        >
          {loading ? "Joining..." : "BATTLE!"}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-600/30 border-2 border-red-500 rounded-lg text-red-200 font-semibold supercell-font">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
