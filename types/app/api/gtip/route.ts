import { calculateGtipMatrix } from "@/lib/gtip-calculator";
import { suggestGtipCodes } from "@/lib/gtip-ai-suggest";
import {
  findGtipEntry,
  getGtipMatrixState,
  GTIP_SYNC_VERSION,
  listGtipChapters,
  runGtipSync,
  countGtipMatches,
  searchGtipEntries,
} from "@/lib/gtip-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "sync" || action === "refresh") {
    try {
      const result = await runGtipSync(true);
      return NextResponse.json(result);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      return NextResponse.json(
        {
          success: false,
          syncVersion: GTIP_SYNC_VERSION,
          message: `Senkronizasyon başarısız: ${detail}`,
        },
        { status: 500 }
      );
    }
  }

  const force = searchParams.get("refresh") === "1";
  const query = searchParams.get("q") ?? "";
  const code = searchParams.get("code");
  const chapter = searchParams.get("chapter") ?? undefined;
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 40))
  );
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const state = await getGtipMatrixState(force);

  if (action === "chapters") {
    return NextResponse.json({
      chapters: listGtipChapters(state.entries),
      total: state.total,
      syncVersion: GTIP_SYNC_VERSION,
    });
  }

  if (action === "suggest") {
    const pool = searchGtipEntries(query, state.entries, {
      limit: 200,
      chapter,
    });
    const suggestions = suggestGtipCodes(query, pool, 8);
    return NextResponse.json({
      suggestions,
      query,
      syncVersion: GTIP_SYNC_VERSION,
    });
  }

  if (code) {
    const entry = findGtipEntry(code, state.entries);
    if (!entry) {
      return NextResponse.json(
        { error: "GTİP kodu bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      entry,
      syncVersion: GTIP_SYNC_VERSION,
      tariffYear: state.tariffYear,
      exchangeRate: state.exchangeRate,
      exchangeSource: state.exchangeSource,
      syncedAt: state.syncedAt,
    });
  }

  const entries = searchGtipEntries(query, state.entries, {
    limit,
    offset,
    chapter,
  });

  const matchTotal = query
    ? countGtipMatches(query, state.entries, chapter)
    : chapter
      ? state.entries.filter((entry) => entry.chapter.startsWith(chapter)).length
      : state.total;

  return NextResponse.json({
    syncVersion: GTIP_SYNC_VERSION,
    matrixVersion: state.matrixVersion,
    entries,
    total: state.total,
    matchTotal,
    query,
    chapter: chapter ?? null,
    offset,
    limit,
    syncedAt: state.syncedAt,
    tariffYear: state.tariffYear,
    exchangeRate: state.exchangeRate,
    exchangeDate: state.exchangeDate,
    exchangeSource: state.exchangeSource,
    source: state.source,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gtipCode, cifValueUsd, weightDesi, freightPerDesiUsd } = body;

    if (
      typeof gtipCode !== "string" ||
      typeof cifValueUsd !== "number" ||
      typeof weightDesi !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Gerekli alanlar: gtipCode (string), cifValueUsd (number), weightDesi (number)",
        },
        { status: 400 }
      );
    }

    if (cifValueUsd <= 0 || weightDesi <= 0) {
      return NextResponse.json(
        { error: "CIF değeri ve desi pozitif olmalıdır." },
        { status: 400 }
      );
    }

    const state = await getGtipMatrixState();
    const gtip = findGtipEntry(gtipCode, state.entries);
    if (!gtip) {
      return NextResponse.json(
        { error: "GTİP kodu bulunamadı." },
        { status: 404 }
      );
    }

    const result = await calculateGtipMatrix(gtip, {
      gtipCode,
      cifValueUsd,
      weightDesi,
      freightPerDesiUsd,
    });

    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json(
      { error: "Hesaplama başarısız." },
      { status: 500 }
    );
  }
}
