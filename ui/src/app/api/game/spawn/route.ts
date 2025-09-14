import { NextResponse } from "next/server";
import { spawnTroop } from "@/lib/gameStore";

export async function POST(req: Request) {
  const { game_id, troop_type, position, team } = await req.json();
  const game = spawnTroop(game_id, troop_type, team, position);
  if (!game) return NextResponse.json({ error: "Game not found or invalid" }, { status: 400 });

  return NextResponse.json({
    success: true,
    message: `Spawned ${troop_type} for team ${team}`,
    state: game,
  });
}