import type {
  Tile,
  Mentsu,
  NormalDecomposition,
  HandDecomposition,
  ScoringContext,
  Yaku,
  Wind,
} from "./types";
import {
  isHonor,
  isYaochuu,
  isTanyao,
  isSangen,
  isKaze,
  isGreen,
  sameTile,
  parseTile,
} from "./tiles";

// ============================================================
// ヘルパー
// ============================================================

function tilesOf(decomp: NormalDecomposition): Tile[] {
  return [
    ...decomp.jantai.tiles,
    ...decomp.mentsuList.flatMap((m) => m.tiles),
  ];
}

function isKoutsuFamily(m: Mentsu): boolean {
  return m.type === "koutsu" || m.type === "kantsu";
}

function isShuntsu(m: Mentsu): boolean {
  return m.type === "shuntsu";
}

// ============================================================
// 通常手の役判定
// ============================================================

function isMenzenTsumo(input: ScoringContext): boolean {
  return input.isTsumo && (!input.openMentsu || input.openMentsu.length === 0);
}

function isPinfu(
  decomp: NormalDecomposition,
  input: ScoringContext,
  winTile: Tile
): boolean {
  if (input.openMentsu && input.openMentsu.length > 0) return false;
  if (!decomp.mentsuList.every(isShuntsu)) return false;

  const head = decomp.jantai.tiles[0];
  if (isSangen(head)) return false;
  if (input.seatWind && head.suit === "honor" && head.value === input.seatWind) return false;
  if (input.roundWind && head.suit === "honor" && head.value === input.roundWind) return false;

  for (const m of decomp.mentsuList) {
    const vals = m.tiles.map((t) => t.value).sort((a, b) => a - b);
    const suit = m.tiles[0].suit;
    if (sameTile(winTile, m.tiles[0]) || sameTile(winTile, m.tiles[2])) {
      if (sameTile(winTile, { suit, value: vals[0], name: "" })) {
        if (vals[2] !== 9) return true;
      } else if (sameTile(winTile, { suit, value: vals[2], name: "" })) {
        if (vals[0] !== 1) return true;
      }
    }
  }
  return false;
}

function isTanyaoYaku(decomp: NormalDecomposition): boolean {
  return tilesOf(decomp).every(isTanyao);
}

function isIipeiko(decomp: NormalDecomposition, input: ScoringContext): boolean {
  if (input.openMentsu && input.openMentsu.length > 0) return false;
  const shuntsus = decomp.mentsuList.filter(isShuntsu);
  for (let i = 0; i < shuntsus.length; i++) {
    for (let j = i + 1; j < shuntsus.length; j++) {
      if (shuntsus[i].tiles.every((t, k) => sameTile(t, shuntsus[j].tiles[k]))) return true;
    }
  }
  return false;
}

function isRyanpeiko(decomp: NormalDecomposition, input: ScoringContext): boolean {
  if (input.openMentsu && input.openMentsu.length > 0) return false;
  const shuntsus = decomp.mentsuList.filter(isShuntsu);
  if (shuntsus.length !== 4) return false;
  const used = [false, false, false, false];
  let pairs = 0;
  for (let i = 0; i < shuntsus.length; i++) {
    if (used[i]) continue;
    for (let j = i + 1; j < shuntsus.length; j++) {
      if (used[j]) continue;
      if (shuntsus[i].tiles.every((t, k) => sameTile(t, shuntsus[j].tiles[k]))) {
        used[i] = used[j] = true;
        pairs++;
        break;
      }
    }
  }
  return pairs === 2;
}

function getYakuhaiYaku(decomp: NormalDecomposition, input: ScoringContext): Yaku[] {
  const result: Yaku[] = [];
  for (const m of decomp.mentsuList) {
    if (!isKoutsuFamily(m)) continue;
    const t = m.tiles[0];
    if (!isHonor(t)) continue;
    if (t.value === 5) result.push({ nameJp: "役牌(白)", han: 1, hanOpen: 1 });
    else if (t.value === 6) result.push({ nameJp: "役牌(發)", han: 1, hanOpen: 1 });
    else if (t.value === 7) result.push({ nameJp: "役牌(中)", han: 1, hanOpen: 1 });
    else {
      // 風牌は場風・自風を独立して判定 (連風牌は2翻)
      if (input.roundWind && t.value === input.roundWind)
        result.push({ nameJp: "役牌(場風)", han: 1, hanOpen: 1 });
      if (input.seatWind && t.value === input.seatWind)
        result.push({ nameJp: "役牌(自風)", han: 1, hanOpen: 1 });
    }
  }
  return result;
}

function isToitoi(decomp: NormalDecomposition): boolean {
  return decomp.mentsuList.every(isKoutsuFamily);
}

/** 暗刻の数を数える (ロン時はあがり牌を含む刻子を除外) */
function countAnkou(decomp: NormalDecomposition, input: ScoringContext, winTile: Tile): number {
  let count = 0;
  for (const m of decomp.mentsuList) {
    if (!isKoutsuFamily(m) || m.isOpen) continue;
    if (!input.isTsumo && sameTile(winTile, m.tiles[0])) continue;
    count++;
  }
  return count;
}

/** タンキ待ち (雀頭があがり牌) かつ刻子に含まれないか */
function isTankiWait(decomp: NormalDecomposition, winTile: Tile): boolean {
  if (!sameTile(decomp.jantai.tiles[0], winTile)) return false;
  return !decomp.mentsuList.some((m) => isKoutsuFamily(m) && sameTile(m.tiles[0], winTile));
}

function isSanshokuDoujun(decomp: NormalDecomposition): boolean {
  const shuntsus = decomp.mentsuList.filter(isShuntsu);
  for (let i = 0; i < shuntsus.length; i++)
    for (let j = i + 1; j < shuntsus.length; j++)
      for (let k = j + 1; k < shuntsus.length; k++) {
        const [a, b, c] = [shuntsus[i], shuntsus[j], shuntsus[k]];
        const suits = new Set([a.tiles[0].suit, b.tiles[0].suit, c.tiles[0].suit]);
        if (!suits.has("honor") && suits.size === 3) {
          const v = a.tiles[0].value;
          if (v === b.tiles[0].value && v === c.tiles[0].value) return true;
        }
      }
  return false;
}

function isSanshokuDoukou(decomp: NormalDecomposition): boolean {
  const koutsus = decomp.mentsuList.filter(isKoutsuFamily);
  for (let i = 0; i < koutsus.length; i++)
    for (let j = i + 1; j < koutsus.length; j++)
      for (let k = j + 1; k < koutsus.length; k++) {
        const [a, b, c] = [koutsus[i], koutsus[j], koutsus[k]];
        const suits = new Set([a.tiles[0].suit, b.tiles[0].suit, c.tiles[0].suit]);
        if (!suits.has("honor") && suits.size === 3) {
          const v = a.tiles[0].value;
          if (v === b.tiles[0].value && v === c.tiles[0].value) return true;
        }
      }
  return false;
}

function isIttsu(decomp: NormalDecomposition): boolean {
  const shuntsus = decomp.mentsuList.filter(isShuntsu);
  for (const suit of ["man", "pin", "sou"] as const) {
    const starts = new Set(
      shuntsus.filter((m) => m.tiles[0].suit === suit).map((m) => m.tiles[0].value)
    );
    if (starts.has(1) && starts.has(4) && starts.has(7)) return true;
  }
  return false;
}

function isChanta(decomp: NormalDecomposition): boolean {
  const all: Mentsu[] = [decomp.jantai, ...decomp.mentsuList];
  return (
    all.every((m) => m.tiles.some(isYaochuu)) &&
    decomp.mentsuList.some(isShuntsu) &&
    all.some((m) => m.tiles.some(isHonor))
  );
}

function isJunchan(decomp: NormalDecomposition): boolean {
  const all: Mentsu[] = [decomp.jantai, ...decomp.mentsuList];
  return (
    all.every((m) => m.tiles.some((t) => !isHonor(t) && isYaochuu(t))) &&
    decomp.mentsuList.some(isShuntsu)
  );
}

function isHonroutou(decomp: NormalDecomposition): boolean {
  const all = tilesOf(decomp);
  return all.every(isYaochuu) && all.some(isHonor);
}

function isHonitsu(decomp: NormalDecomposition): boolean {
  const all = tilesOf(decomp);
  const numberSuits = new Set(all.filter((t) => !isHonor(t)).map((t) => t.suit));
  return numberSuits.size === 1 && all.some(isHonor);
}

function isChinitsu(decomp: NormalDecomposition): boolean {
  const all = tilesOf(decomp);
  if (all.some(isHonor)) return false;
  return new Set(all.map((t) => t.suit)).size === 1;
}

function isShouSangen(decomp: NormalDecomposition): boolean {
  const koutsuCount = decomp.mentsuList.filter(
    (m) => isKoutsuFamily(m) && isSangen(m.tiles[0])
  ).length;
  return koutsuCount === 2 && isSangen(decomp.jantai.tiles[0]);
}

// ============================================================
// 役満判定
// ============================================================

function isSuuankou(decomp: NormalDecomposition, input: ScoringContext, winTile: Tile): boolean {
  return countAnkou(decomp, input, winTile) === 4;
}

function isDaisangen(decomp: NormalDecomposition): boolean {
  return decomp.mentsuList.filter((m) => isKoutsuFamily(m) && isSangen(m.tiles[0])).length === 3;
}

function isShousuushii(decomp: NormalDecomposition): boolean {
  const kazeKoutsu = decomp.mentsuList.filter((m) => isKoutsuFamily(m) && isKaze(m.tiles[0])).length;
  return kazeKoutsu === 3 && isKaze(decomp.jantai.tiles[0]);
}

function isDaisuushii(decomp: NormalDecomposition): boolean {
  return decomp.mentsuList.filter((m) => isKoutsuFamily(m) && isKaze(m.tiles[0])).length === 4;
}

function isTsuuiisou(decomp: NormalDecomposition): boolean {
  return tilesOf(decomp).every(isHonor);
}

function isChinroutou(decomp: NormalDecomposition): boolean {
  const all = tilesOf(decomp);
  return all.every((t) => !isHonor(t) && (t.value === 1 || t.value === 9));
}

function isRyuuiisou(decomp: NormalDecomposition): boolean {
  return tilesOf(decomp).every(isGreen);
}

function isSuukantsu(decomp: NormalDecomposition): boolean {
  return decomp.mentsuList.filter((m) => m.type === "kantsu").length === 4;
}

function isChurenPoutou(decomp: NormalDecomposition): boolean {
  const all = tilesOf(decomp);
  if (all.some(isHonor)) return false;
  if (new Set(all.map((t) => t.suit)).size !== 1) return false;
  const counts = new Array(10).fill(0);
  all.forEach((t) => counts[t.value]++);
  const required = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
  return required.every((r, i) => counts[i] >= r);
}

/** 純正九蓮宝燈: あがり牌を除いた13枚が 1112345678999 になるか */
function isPureChurenPoutou(decomp: NormalDecomposition, winTile: Tile): boolean {
  if (!isChurenPoutou(decomp)) return false;
  const all = tilesOf(decomp);
  const remaining = [...all];
  const idx = remaining.findIndex((t) => sameTile(t, winTile));
  if (idx === -1) return false;
  remaining.splice(idx, 1);
  const vals = remaining.map((t) => t.value).sort((a, b) => a - b);
  const required = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9];
  return vals.length === 13 && vals.every((v, i) => v === required[i]);
}

// ============================================================
// 通常手の役リスト取得
// ============================================================

export function getYakuForNormal(
  decomp: NormalDecomposition,
  input: ScoringContext,
  winTile: Tile
): Yaku[] {
  const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
  const yakuman: Yaku[] = [];

  // ---- 役満 (複合も考慮して全て列挙) ----

  // 四槓子 (最優先)
  if (isSuukantsu(decomp))
    yakuman.push({ nameJp: "四槓子", han: 13, isYakuman: true, yakumanMultiplier: 1 });

  // 四暗刻: タンキ待ち → ダブル, それ以外 (ツモ双碰) → 一倍
  // ※ 四暗槓 (4暗槓) は四槓子と複合する
  if (isSuuankou(decomp, input, winTile) && !isSuukantsu(decomp)) {
    if (isTankiWait(decomp, winTile)) {
      yakuman.push({ nameJp: "四暗刻単騎", han: 13, isYakuman: true, yakumanMultiplier: 2 });
    } else {
      yakuman.push({ nameJp: "四暗刻", han: 13, isYakuman: true, yakumanMultiplier: 1 });
    }
  }

  // 大四喜 → ダブル役満, 小四喜 → 一倍役満
  if (isDaisuushii(decomp)) {
    yakuman.push({ nameJp: "大四喜", han: 13, isYakuman: true, yakumanMultiplier: 2 });
  } else if (isShousuushii(decomp)) {
    yakuman.push({ nameJp: "小四喜", han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  if (isDaisangen(decomp))
    yakuman.push({ nameJp: "大三元", han: 13, isYakuman: true, yakumanMultiplier: 1 });

  if (isTsuuiisou(decomp))
    yakuman.push({ nameJp: "字一色", han: 13, isYakuman: true, yakumanMultiplier: 1 });

  if (isChinroutou(decomp))
    yakuman.push({ nameJp: "清老頭", han: 13, isYakuman: true, yakumanMultiplier: 1 });

  if (isRyuuiisou(decomp))
    yakuman.push({ nameJp: "緑一色", han: 13, isYakuman: true, yakumanMultiplier: 1 });

  // 純正九蓮宝燈 → ダブル, 九蓮宝燈 → 一倍
  if (isPureChurenPoutou(decomp, winTile)) {
    yakuman.push({ nameJp: "純正九蓮宝燈", han: 13, isYakuman: true, yakumanMultiplier: 2 });
  } else if (isChurenPoutou(decomp)) {
    yakuman.push({ nameJp: "九蓮宝燈", han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  if (yakuman.length > 0) return yakuman;

  // ---- 通常役 ----
  const result: Yaku[] = [];

  if (input.isDoubleRiichi) result.push({ nameJp: "ダブル立直", han: 2 });
  else if (input.isRiichi) result.push({ nameJp: "立直", han: 1 });

  if (input.isIppatsu) result.push({ nameJp: "一発", han: 1 });
  if (input.isRinshan) result.push({ nameJp: "嶺上開花", han: 1, hanOpen: 1 });
  if (input.isChankan) result.push({ nameJp: "槍槓", han: 1, hanOpen: 1 });
  if (input.isHaitei)
    result.push({ nameJp: input.isTsumo ? "海底摸月" : "河底撈魚", han: 1, hanOpen: 1 });

  if (!isOpen && isMenzenTsumo(input))
    result.push({ nameJp: "門前清自摸和", han: 1 });

  if (!isOpen && isPinfu(decomp, input, winTile))
    result.push({ nameJp: "平和", han: 1 });

  if (isTanyaoYaku(decomp))
    result.push({ nameJp: "断么九", han: 1, hanOpen: 1 });

  if (!isOpen && isRyanpeiko(decomp, input))
    result.push({ nameJp: "二盃口", han: 3 });
  else if (!isOpen && isIipeiko(decomp, input))
    result.push({ nameJp: "一盃口", han: 1 });

  result.push(...getYakuhaiYaku(decomp, input));

  if (isSanshokuDoujun(decomp))
    result.push({ nameJp: "三色同順", han: 2, hanOpen: 1 });
  if (isSanshokuDoukou(decomp))
    result.push({ nameJp: "三色同刻", han: 2, hanOpen: 2 });
  if (isIttsu(decomp))
    result.push({ nameJp: "一気通貫", han: 2, hanOpen: 1 });

  if (isJunchan(decomp))
    result.push({ nameJp: "純全帯么九", han: 3, hanOpen: 2 });
  else if (isChanta(decomp))
    result.push({ nameJp: "混全帯么九", han: 2, hanOpen: 1 });

  if (isToitoi(decomp)) result.push({ nameJp: "対々和", han: 2, hanOpen: 2 });

  const ankouCount = countAnkou(decomp, input, winTile);
  if (ankouCount >= 3) result.push({ nameJp: "三暗刻", han: 2, hanOpen: 2 });

  if (isHonroutou(decomp)) result.push({ nameJp: "混老頭", han: 2, hanOpen: 2 });
  if (isShouSangen(decomp)) result.push({ nameJp: "小三元", han: 2, hanOpen: 2 });

  if (isChinitsu(decomp)) result.push({ nameJp: "清一色", han: 6, hanOpen: 5 });
  else if (isHonitsu(decomp)) result.push({ nameJp: "混一色", han: 3, hanOpen: 2 });

  return result;
}

// ============================================================
// 七対子
// ============================================================

export function getYakuForChiitoitsu(input: ScoringContext): Yaku[] {
  const result: Yaku[] = [];
  if (input.isDoubleRiichi) result.push({ nameJp: "ダブル立直", han: 2 });
  else if (input.isRiichi) result.push({ nameJp: "立直", han: 1 });
  if (input.isIppatsu) result.push({ nameJp: "一発", han: 1 });
  if (input.isHaitei) result.push({ nameJp: "海底摸月", han: 1 });
  if (input.isTsumo && (!input.openMentsu || !input.openMentsu.length))
    result.push({ nameJp: "門前清自摸和", han: 1 });
  result.push({ nameJp: "七対子", han: 2 });
  return result;
}

// ============================================================
// 国士無双
// ============================================================

/**
 * 国士無双の役を判定。
 * 十三面待ち (あがり牌を除いた13枚が全て異なる幺九牌) → ダブル役満
 */
export function getYakuForKokushi(input: ScoringContext, allTiles: Tile[]): Yaku[] {
  let winTile: Tile;
  try { winTile = parseTile(input.winningTile); }
  catch { return [{ nameJp: "国士無双", han: 13, isYakuman: true, yakumanMultiplier: 1 }]; }

  // あがり牌を1枚除いた残り13枚
  const remaining = [...allTiles];
  const idx = remaining.findIndex((t) => sameTile(t, winTile));
  if (idx !== -1) remaining.splice(idx, 1);

  const isThirteenSided = new Set(remaining.map((t) => t.name)).size === 13;

  if (isThirteenSided) {
    return [{ nameJp: "国士無双十三面待ち", han: 13, isYakuman: true, yakumanMultiplier: 2 }];
  }
  return [{ nameJp: "国士無双", han: 13, isYakuman: true, yakumanMultiplier: 1 }];
}

export function hasValidYaku(yaku: Yaku[]): boolean {
  return yaku.length > 0;
}
