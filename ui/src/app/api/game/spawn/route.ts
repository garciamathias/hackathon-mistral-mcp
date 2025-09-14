import { NextResponse } from "next/server";
import { spawnTroop } from "@/lib/gameStore";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { game_id, troop_type, position, team } = body || {};

  // Validation de surface
  if (
    typeof game_id !== "string" ||
    typeof troop_type !== "string" ||
    (team !== "red" && team !== "blue") ||
    !position ||
    typeof position.row !== "number" ||
    typeof position.col !== "number"
  ) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  try {
    const game = spawnTroop(game_id, troop_type, team, position);
    if (!game) return NextResponse.json({ error: "Game not found or invalid" }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: `Spawned ${troop_type} for team ${team}`,
      state: game,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Spawn failed" }, { status: 422 });
  }
}