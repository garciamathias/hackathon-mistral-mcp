import { NextResponse } from "next/server";
import { createGame } from "@/lib/gameStore";

export async function POST() {
  const game = createGame();
  return NextResponse.json({ game_id: game.game_id, message: "Game initialized" });
}