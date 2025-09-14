import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const PLAYER_ID_COOKIE = 'player_id';
const PLAYER_NAME_COOKIE = 'player_name';

export async function getOrCreatePlayerId(): Promise<string> {
  const cookieStore = await cookies();
  let playerId = cookieStore.get(PLAYER_ID_COOKIE)?.value;

  if (!playerId) {
    // Generate a unique player ID using UUID v4
    playerId = `player_${uuidv4()}`;
    console.log(`[Session] Creating new player ID: ${playerId}`);
    cookieStore.set(PLAYER_ID_COOKIE, playerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
  } else {
    console.log(`[Session] Using existing player ID: ${playerId}`);
  }

  return playerId;
}

export async function getOrCreatePlayerName(): Promise<string> {
  const cookieStore = await cookies();
  let playerName = cookieStore.get(PLAYER_NAME_COOKIE)?.value;

  if (!playerName) {
    playerName = `Player_${Math.floor(Math.random() * 10000)}`;
    cookieStore.set(PLAYER_NAME_COOKIE, playerName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
  }

  return playerName;
}

export async function setPlayerName(name: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PLAYER_NAME_COOKIE, name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

export async function getSessionHeaders() {
  const playerId = await getOrCreatePlayerId();
  const playerName = await getOrCreatePlayerName();

  return {
    'x-player-id': playerId,
    'x-player-name': playerName,
    'Content-Type': 'application/json'
  };
}