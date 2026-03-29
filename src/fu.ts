import type { Tile, Mentsu, NormalDecomposition, ScoringContext, Wind } from "./types";
import { isHonor, isYaochuu, isSangen, sameTile } from "./tiles";

// ============================================================
// 符計算
// ============================================================

/**
 * 面子の符を計算する。
 * 刻子: 中張=2, 么九=4 (副露は半分)
 * 槓子: 中張=8, 么九=16 (副露は半分)
 * 順子: 0
 */
function mentsuFu(mentsu: Mentsu): number {
  if (mentsu.type === "shuntsu" || mentsu.type === "jantai") return 0;

  const tile = mentsu.tiles[0];
  const isYao = isYaochuu(tile);
  const base = isYao ? 4 : 2;

  if (mentsu.type === "kantsu") {
    // 暗槓: base×8 (中張=16, 么九=32)
    // 明槓: base×4 (中張=8,  么九=16)
    return mentsu.isOpen ? base * 4 : base * 8;
  }

  // 刻子: 暗刻=base×2, 明刻=base
  return mentsu.isOpen ? base : base * 2;
}

/**
 * 雀頭の符を計算する。
 * 役牌 (場風・自風・三元牌) は2符, それ以外は0符
 */
function jantaiFu(jantai: Mentsu, seatWind?: Wind, roundWind?: Wind): number {
  const tile = jantai.tiles[0];
  if (!isHonor(tile)) return 0;
  if (isSangen(tile)) return 2;
  // 連風牌は自風符 + 場風符 = 合計4符
  let fu = 0;
  if (seatWind && tile.value === seatWind) fu += 2;
  if (roundWind && tile.value === roundWind) fu += 2;
  return fu;
}

/**
 * 待ちの符を計算する。
 * 嵌張 (カンチャン), 辺張 (ペンチャン), 単騎 = 2符
 * 双碰 (シャンポン), 両面 = 0符
 */
function matiFu(
  decomp: NormalDecomposition,
  winTile: Tile
): number {
  // 単騎待ちか確認 (雀頭があがり牌)
  if (sameTile(winTile, decomp.jantai.tiles[0])) return 2;

  for (const m of decomp.mentsuList) {
    if (!m.tiles.some((t) => sameTile(t, winTile))) continue;

    if (m.type === "koutsu") {
      // 双碰待ち = 0符
      return 0;
    }

    // 順子の場合
    const sorted = [...m.tiles].sort((a, b) => a.value - b.value);
    const minVal = sorted[0].value;
    const maxVal = sorted[2].value;
    const midVal = sorted[1].value;

    if (winTile.value === midVal) {
      // 嵌張 = 2符
      return 2;
    }
    if (
      (winTile.value === minVal && maxVal === 9) ||
      (winTile.value === maxVal && minVal === 1)
    ) {
      // 辺張 = 2符
      return 2;
    }
    // 両面 = 0符
    return 0;
  }

  return 0;
}

/**
 * 通常手の符計算
 */
export function calcFuNormal(
  decomp: NormalDecomposition,
  input: ScoringContext,
  winTile: Tile,
  hasPinfu: boolean
): number {
  const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);

  // 平和
  if (hasPinfu) {
    return input.isTsumo ? 20 : 30;
  }

  let fu = 30; // 基本符 (副露あり: 30→20は門前加符で調整)

  // 副露アガリの基本符は30 (鳴き手は基本符20+加符で30に丸め)
  if (isOpen) fu = 20;

  // ツモ加符
  if (input.isTsumo && !isOpen) fu += 2; // 門前ツモは2符 (平和以外)

  // 面子符
  for (const m of decomp.mentsuList) {
    fu += mentsuFu(m);
  }

  // 雀頭符
  fu += jantaiFu(decomp.jantai, input.seatWind, input.roundWind);

  // 待ち符
  fu += matiFu(decomp, winTile);

  // 10符単位に切り上げ
  return Math.ceil(fu / 10) * 10;
}

/**
 * 七対子の符は固定25符
 */
export function calcFuChiitoitsu(): number {
  return 25;
}

/**
 * 国士の符は固定30符 (役満なので通常は使わない)
 */
export function calcFuKokushi(): number {
  return 30;
}
