import { NextResponse } from "next/server";
import { getGame, updateGameTime } from "@/lib/gameStore";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const game = getGame(params.id);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  
  // Mettre à jour le temps et l'elixir avant de retourner l'état
  const updatedGame = updateGameTime(params.id);
  if (!updatedGame) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  
  return NextResponse.json(updatedGame);
}
