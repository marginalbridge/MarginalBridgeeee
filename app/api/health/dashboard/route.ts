import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listBotLogsByUser, listOrdersByUser } from "@/lib/orders-db";
import { listStoresByUser } from "@/lib/stores-db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Yetkisiz. Admin hesabı ile giriş yapın.",
      },
      { status: 403 }
    );
  }

  const steps: Array<{
    step: string;
    ok: boolean;
    detail?: string;
  }> = [];

  try {
    const stores = await listStoresByUser(user.id);
    steps.push({
      step: "listStoresByUser",
      ok: true,
      detail: `stores=${stores.length}`,
    });
  } catch (e) {
    steps.push({
      step: "listStoresByUser",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const orders = await listOrdersByUser(user.id);
    steps.push({
      step: "listOrdersByUser",
      ok: true,
      detail: `orders=${orders.length}`,
    });
  } catch (e) {
    steps.push({
      step: "listOrdersByUser",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const logs = await listBotLogsByUser(user.id);
    steps.push({
      step: "listBotLogsByUser",
      ok: true,
      detail: `logs=${logs.length}`,
    });
  } catch (e) {
    steps.push({
      step: "listBotLogsByUser",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json({
    ok: steps.every((s) => s.ok),
    user: { id: user.id, email: user.email, role: user.role },
    steps,
  });
}

