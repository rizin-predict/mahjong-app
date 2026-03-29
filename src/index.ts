import type {
  ScoringInput,
  ScoringContext,
  ScoringResult,
  HandDecomposition,
  NormalDecomposition,
  Mentsu,
  Yaku,
  Tile,
  Wind,
} from "./types";
import { parseTiles, parseTile, countDora, sameTile } from "./tiles";
import { getAllDecompositions } from "./decompose";
import {
  getYakuForNormal,
  getYakuForChiitoitsu,
  getYakuForKokushi,
  hasValidYaku,
} from "./yaku";
import { calcFuNormal, calcFuChiitoitsu, calcFuKokushi } from "./fu";
import { calcBasicPoints, calcPayment, fuHanLabel } from "./score";

// ============================================================
// メインのスコア計算関数
// ============================================================

/**
 * 手牌と条件から役・符・点数を計算して返す。
 *
 * @param input   手牌・あがり条件などの入力
 * @param seatWind  自風 (1=東, 2=南, 3=西, 4=北)
 * @param roundWind 場風 (1=東, 2=南, 3=西, 4=北)
 */
export function calcScore(
  input: ScoringInput,
  seatWind: Wind,
  roundWind: Wind,
): ScoringResult {
  // 自風・場風を付加した内部コンテキストを生成
  const ctx: ScoringContext = { ...input, seatWind, roundWind };

  let allTiles: Tile[];
  try {
    allTiles = parseTiles(ctx.tiles);
  } catch (e: any) {
    return invalidResult(e.message);
  }

  // 槓子 (ankan/minkan) を事前に抽出
  const kantsuMelds = (ctx.openMentsu ?? []).filter(
    (m) => m.type === "ankan" || m.type === "minkan"
  );
  const kanCount = kantsuMelds.length;

  if (allTiles.length !== 14 + kanCount) {
    return invalidResult(
      `牌の枚数が正しくありません: ${allTiles.length}枚 (${14 + kanCount}枚必要)`
    );
  }

  let winTile: Tile;
  try {
    winTile = parseTile(ctx.winningTile);
  } catch (e: any) {
    return invalidResult(e.message);
  }

  const winIdx = allTiles.findIndex((t) => t.suit === winTile.suit && t.value === winTile.value);
  if (winIdx === -1) {
    return invalidResult(`あがり牌 ${ctx.winningTile} が手牌に含まれていません`);
  }

  let doraCount = 0;
  if (ctx.doraIndicators && ctx.doraIndicators.length > 0) {
    try {
      const doraIndicatorTiles = parseTiles(ctx.doraIndicators);
      doraCount = countDora(allTiles, doraIndicatorTiles);
    } catch (e: any) {
      return invalidResult(`ドラ表示牌エラー: ${e.message}`);
    }
  }

  // 槓子の牌を手牌から除去し、Mentsu オブジェクトを作成
  let tilesForDecomp = [...allTiles];
  const preformedKantsu: Mentsu[] = [];
  for (const km of kantsuMelds) {
    let kantsuTiles: Tile[];
    try {
      kantsuTiles = parseTiles(km.tiles);
    } catch (e: any) {
      return invalidResult(`槓子の牌エラー: ${e.message}`);
    }
    const remaining = [...tilesForDecomp];
    for (const kt of kantsuTiles) {
      const idx = remaining.findIndex((t) => sameTile(t, kt));
      if (idx === -1) return invalidResult(`槓子の牌 ${kt.name} が手牌に見つかりません`);
      remaining.splice(idx, 1);
    }
    tilesForDecomp = remaining;
    preformedKantsu.push({
      type: "kantsu",
      tiles: kantsuTiles,
      isOpen: km.type === "minkan",
    });
  }

  const decompositions = getAllDecompositions(tilesForDecomp, preformedKantsu);
  if (decompositions.length === 0) {
    return invalidResult("有効な上がり形ではありません");
  }

  let bestResult: ScoringResult | null = null;

  for (const decomp of decompositions) {
    const candidate = evaluateDecomposition(decomp, ctx, winTile, doraCount, allTiles);
    if (!candidate.isValid) continue;
    if (
      !bestResult ||
      candidate.basicPoints > bestResult.basicPoints ||
      (candidate.basicPoints === bestResult.basicPoints && candidate.han > bestResult.han)
    ) {
      bestResult = candidate;
    }
  }

  if (!bestResult) {
    return invalidResult("有効な役がありません (役なし)");
  }

  return bestResult;
}

// ============================================================
// 分解1つを評価
// ============================================================

function evaluateDecomposition(
  decomp: HandDecomposition,
  input: ScoringContext,
  winTile: Tile,
  doraCount: number,
  allTiles: Tile[]
): ScoringResult {
  const isDealer = input.seatWind === 1;

  if (decomp.kind === "normal") {
    return evaluateNormal(decomp, input, winTile, doraCount, isDealer);
  } else if (decomp.kind === "chiitoitsu") {
    return evaluateChiitoitsu(input, doraCount, isDealer);
  } else {
    return evaluateKokushi(input, isDealer, allTiles);
  }
}

function evaluateNormal(
  decomp: NormalDecomposition,
  input: ScoringContext,
  winTile: Tile,
  doraCount: number,
  isDealer: boolean
): ScoringResult {
  const yaku = getYakuForNormal(decomp, input, winTile);
  if (!hasValidYaku(yaku)) return invalidResult("役なし");

  const isYakuman = yaku.some((y) => y.isYakuman);
  const hasPinfu = yaku.some((y) => y.nameJp === "平和");
  const fu = calcFuNormal(decomp, input, winTile, hasPinfu);

  let han: number;
  let yakumanMultiplier: number | undefined;

  if (isYakuman) {
    // 役満倍数を合算 (複合役満)
    yakumanMultiplier = yaku.reduce((sum, y) => sum + (y.yakumanMultiplier ?? 1), 0);
    han = 13 * yakumanMultiplier;
  } else {
    const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
    han = yaku.reduce((sum, y) => {
      if (isOpen && y.hanOpen !== undefined) return sum + y.hanOpen;
      return sum + y.han;
    }, 0) + doraCount;
  }

  const basicPoints = calcBasicPoints(han, fu, yakumanMultiplier);
  const payment = calcPayment(basicPoints, isDealer, input.isTsumo);

  const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
  return {
    isValid: true,
    decomposition: decomp,
    yaku: yaku.map((y) => ({
      nameJp: y.nameJp,
      han: isOpen && y.hanOpen !== undefined ? y.hanOpen : y.han,
    })),
    dora: doraCount,
    han,
    fu,
    basicPoints,
    yakumanMultiplier,
    payment,
  };
}

function evaluateChiitoitsu(
  input: ScoringContext,
  doraCount: number,
  isDealer: boolean
): ScoringResult {
  const yaku = getYakuForChiitoitsu(input);
  if (!hasValidYaku(yaku)) return invalidResult("役なし");

  const fu = calcFuChiitoitsu();
  const han = yaku.reduce((sum, y) => sum + y.han, 0) + doraCount;
  const basicPoints = calcBasicPoints(han, fu);
  const payment = calcPayment(basicPoints, isDealer, input.isTsumo);

  return {
    isValid: true,
    yaku: yaku.map((y) => ({ nameJp: y.nameJp, han: y.han })),
    dora: doraCount,
    han,
    fu,
    basicPoints,
    payment,
  };
}

function evaluateKokushi(
  input: ScoringContext,
  isDealer: boolean,
  allTiles: Tile[]
): ScoringResult {
  const yaku = getYakuForKokushi(input, allTiles);
  const fu = calcFuKokushi();
  const yakumanMultiplier = yaku.reduce((sum, y) => sum + (y.yakumanMultiplier ?? 1), 0);
  const han = 13 * yakumanMultiplier;
  const basicPoints = calcBasicPoints(han, fu, yakumanMultiplier);
  const payment = calcPayment(basicPoints, isDealer, input.isTsumo);

  return {
    isValid: true,
    yaku: yaku.map((y) => ({ nameJp: y.nameJp, han: y.han })),
    dora: 0,
    han,
    fu,
    basicPoints,
    yakumanMultiplier,
    payment,
  };
}

function invalidResult(error: string): ScoringResult {
  return {
    isValid: false,
    error,
    yaku: [],
    dora: 0,
    han: 0,
    fu: 0,
    basicPoints: 0,
    payment: {},
  };
}

export { fuHanLabel } from "./score";
export { calcBasicPoints, calcPayment } from "./score";
export type { ScoringInput, ScoringResult, Payment, Wind } from "./types";
