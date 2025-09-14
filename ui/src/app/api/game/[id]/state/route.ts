import { NextResponse } from "next/server";
import { getGame, updateGameTime } from "@/lib/gameStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const game = getGame(id);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const updatedGame = updateGameTime(id);
  if (!updatedGame) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  return NextResponse.json(updatedGame, { headers: { "Cache-Control": "no-store" } });
}
