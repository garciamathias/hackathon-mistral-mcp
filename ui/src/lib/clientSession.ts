// Client-side session management using localStorage
// This ensures player IDs persist across domains (Vercel + Railway)

export const getOrCreatePlayerId = (): string => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  let playerId = localStorage.getItem('player_id');

  if (!playerId) {
    // Generate a unique player ID with timestamp and random string
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('player_id', playerId);
    console.log('[ClientSession] Created new player ID:', playerId);
  } else {
    console.log('[ClientSession] Using existing player ID:', playerId);
  }

  return playerId;
};

export const getOrCreatePlayerName = (): string => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  let playerName = localStorage.getItem('player_name');

  if (!playerName) {
    // Generate a random player name
    playerName = `Player_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem('player_name', playerName);
    console.log('[ClientSession] Created new player name:', playerName);
  }

  return playerName;
};

export const setPlayerName = (name: string): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('player_name', name);
  console.log('[ClientSession] Updated player name to:', name);
};

export const getSessionHeaders = (): Record<string, string> => {
  const playerId = getOrCreatePlayerId();
  const playerName = getOrCreatePlayerName();

  return {
    'x-player-id': playerId,
    'x-player-name': playerName,
    'Content-Type': 'application/json'
  };
};

export const clearSession = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('player_id');
  localStorage.removeItem('player_name');
  console.log('[ClientSession] Session cleared');
};