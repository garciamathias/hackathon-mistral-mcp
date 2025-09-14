"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/services/api';
import { MatchInfo, GameStatus } from '@/types/backend';

export default function Lobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [matchId, setMatchId] = useState('');
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with a default player name
  useEffect(() => {
    // Generate a random player name for this session
    setPlayerName(`Player_${Math.floor(Math.random() * 10000)}`);
  }, []);

  // Fetch available matches
  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const matchList = await apiClient.listMatches();
      setMatches(matchList.filter(m => m.status === GameStatus.WAITING));
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  const handleCreateMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Player name is now managed server-side via cookies
      // No need to update it here

      const response = await apiClient.createMatch();
      if (response) {
        // Store match ID and player info, then navigate to arena
        sessionStorage.setItem('matchId', response.matchId);
        sessionStorage.setItem('isHost', 'true');
        // Store the player ID from the response if available
        if (response.playerState) {
          sessionStorage.setItem('playerId', response.playerState.id);
          sessionStorage.setItem('playerName', response.playerState.name);
          sessionStorage.setItem('playerTeam', response.playerState.team);
        }
        router.push('/arena?mode=online');
      } else {
        setError('Failed to create match');
      }
    } catch (err) {
      setError('Failed to create match');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async (joinMatchId?: string) => {
    const targetMatchId = joinMatchId || matchId;
    if (!targetMatchId) {
      setError('Please enter a match ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Player name is now managed server-side via cookies
      // No need to update it here

      const response = await apiClient.joinMatch(targetMatchId);
      if (response) {
        // Store match ID and player info, then navigate to arena
        sessionStorage.setItem('matchId', targetMatchId);
        sessionStorage.setItem('isHost', 'false');
        sessionStorage.setItem('playerTeam', response.team);
        // Store the player ID from the response
        if (response.playerState) {
          sessionStorage.setItem('playerId', response.playerState.id);
          sessionStorage.setItem('playerName', response.playerState.name);
        }
        router.push('/arena?mode=online');
      } else {
        setError('Failed to join match');
      }
    } catch (err) {
      setError('Failed to join match - match may be full or not exist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case GameStatus.WAITING:
        return 'text-green-500';
      case GameStatus.IN_PROGRESS:
        return 'text-yellow-500';
      case GameStatus.ENDED:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Create/Join Section */}
        <Card className="p-8 bg-black/50 backdrop-blur border-purple-500/30">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            🎮 Clash Royale Online
          </h1>

          {/* Player Name */}
          <div className="mb-6">
            <label className="text-white text-sm mb-2 block">Your Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-black/50 border-purple-500/50 text-white"
            />
          </div>

          {/* Create Match */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Match</h2>
            <Button
              onClick={handleCreateMatch}
              disabled={loading || !playerName}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3"
            >
              {loading ? 'Creating...' : '⚔️ Create Match'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-4 text-purple-300">OR</span>
            </div>
          </div>

          {/* Join Match */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Join Existing Match</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter Match ID"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="bg-black/50 border-purple-500/50 text-white"
              />
              <Button
                onClick={() => handleJoinMatch()}
                disabled={loading || !playerName}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6"
              >
                {loading ? 'Joining...' : 'Join'}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Back Button */}
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full mt-6 border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            ← Back to Home
          </Button>
        </Card>

        {/* Available Matches */}
        <Card className="p-8 bg-black/50 backdrop-blur border-purple-500/30">
          <h2 className="text-3xl font-bold text-white mb-6">Available Matches</h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {matches.length === 0 ? (
              <div className="text-center py-8 text-purple-300">
                <p className="text-lg mb-2">No matches available</p>
                <p className="text-sm opacity-75">Create a new match to start playing!</p>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-black/30 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-semibold">
                        Match #{match.id.substring(0, 8)}
                      </p>
                      <p className={`text-sm ${getStatusColor(match.status)}`}>
                        {match.status}
                      </p>
                    </div>
                    <span className="text-purple-300 text-sm">
                      {match.playerCount}/{match.maxPlayers} players
                    </span>
                  </div>

                  {/* Players in match */}
                  {match.players.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-purple-300 mb-1">Players:</p>
                      <div className="flex gap-2">
                        {match.players.map((player) => (
                          <span
                            key={player.id}
                            className={`text-xs px-2 py-1 rounded ${
                              player.team === 'red'
                                ? 'bg-red-500/30 text-red-300'
                                : 'bg-blue-500/30 text-blue-300'
                            }`}
                          >
                            {player.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.playerCount < match.maxPlayers && (
                    <Button
                      onClick={() => handleJoinMatch(match.id)}
                      disabled={loading}
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                      Join Match
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <h3 className="text-white font-semibold mb-2">How to Play</h3>
            <ul className="text-sm text-purple-300 space-y-1">
              <li>• Create a match or join an existing one</li>
              <li>• Wait for another player to join</li>
              <li>• Battle starts automatically when room is full</li>
              <li>• Drag cards to deploy troops</li>
              <li>• Destroy enemy towers to win!</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}