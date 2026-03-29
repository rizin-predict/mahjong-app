import type {
  Tile,
  Mentsu,
  NormalDecomposition,
  ChiitoitsuDecomposition,
  KokushiDecomposition,
  HandDecomposition,
} from "./types";
import { sameTile, sortTiles, isYaochuu, KOKUSHI_TILES, parseTile } from "./tiles";

// ---- ユーティリティ --------------------------------------------------------

/** tiles から指定インデックスの牌を除いたコピーを返す */
function removeTileAt(tiles: Tile[], index: number): Tile[] {
  return [...tiles.slice(0, index), ...tiles.slice(index + 1)];
}

/** ソート済み tiles から同じ牌を n 枚取り除く (先頭から) */
function removeFirst(tiles: Tile[], target: Tile, count: number): Tile[] | null {
  const result = [...tiles];
  for (let i = 0; i < count; i++) {
    const idx = result.findIndex((t) => sameTile(t, target));
    if (idx === -1) return null;
    result.splice(idx, 1);
  }
  return result;
}

// ---- 通常手の分解 ----------------------------------------------------------

/**
 * ソート済みの手牌を再帰的に面子に分解する。
 * @returns 分解できるすべての面子リストの配列 (重複あり得る)
 */
function decomposeToMentsu(tiles: Tile[]): Mentsu[][] {
  if (tiles.length === 0) return [[]];
  if (tiles.length % 3 !== 0) return [];

  const results: Mentsu[][] = [];
  const first = tiles[0];

  // --- 刻子 (同じ牌3枚) ---
  const afterKoutsu = removeFirst(tiles, first, 3);
  if (afterKoutsu) {
    const koutsu: Mentsu = {
      type: "koutsu",
      tiles: [first, first, first],
      isOpen: false,
    };
    for (const rest of decomposeToMentsu(afterKoutsu)) {
      results.push([koutsu, ...rest]);
    }
  }

  // --- 順子 (連続する3枚の数牌) ---
  if (first.suit !== "honor") {
    const second = tiles.find(
      (t) => t.suit === first.suit && t.value === first.value + 1
    );
    const third = tiles.find(
      (t) => t.suit === first.suit && t.value === first.value + 2
    );
    if (second && third) {
      let remaining = [...tiles];
      // first を削除
      remaining.splice(remaining.findIndex((t) => sameTile(t, first)), 1);
      // second を削除
      remaining.splice(remaining.findIndex((t) => sameTile(t, second)), 1);
      // third を削除
      remaining.splice(remaining.findIndex((t) => sameTile(t, third)), 1);

      const shuntsu: Mentsu = {
        type: "shuntsu",
        tiles: [first, second, third],
        isOpen: false,
      };
      for (const rest of decomposeToMentsu(remaining)) {
        results.push([shuntsu, ...rest]);
      }
    }
  }

  return results;
}

/**
 * 通常手 (4面子1雀頭) の全分解を返す。
 * preformedKantsu を受け取り、それらを除いた残りの牌で (4-N)面子を探す。
 */
export function decomposeNormal(tiles: Tile[], preformedKantsu: Mentsu[] = []): NormalDecomposition[] {
  const expectedMentsu = 4 - preformedKantsu.length;
  const sorted = sortTiles(tiles);
  const results: NormalDecomposition[] = [];
  const seen = new Set<string>();

  // 各牌を雀頭候補として試す
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (!sameTile(a, b)) continue;
    // 同じ雀頭候補が連続する場合はスキップ (重複除去)
    if (i > 0 && sameTile(sorted[i - 1], a)) continue;

    // 雀頭を除いた残り牌
    let rest = [...sorted];
    rest.splice(i, 1);
    rest.splice(i, 1); // i番目を2回削除

    const jantai: Mentsu = { type: "jantai", tiles: [a, b], isOpen: false };

    for (const mentsuList of decomposeToMentsu(rest)) {
      if (mentsuList.length !== expectedMentsu) continue;
      // 重複チェック用キー
      const allMentsu = [...preformedKantsu, ...mentsuList];
      const key = serializeDecomposition(allMentsu, jantai);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ kind: "normal", mentsuList: allMentsu, jantai });
    }
  }

  return results;
}

function serializeDecomposition(mentsuList: Mentsu[], jantai: Mentsu): string {
  const serMentsu = (m: Mentsu) =>
    `${m.type}:${m.tiles.map((t) => t.name).join(",")}`;
  return [
    serMentsu(jantai),
    ...mentsuList.map(serMentsu).sort(),
  ].join("|");
}

// ---- 七対子 ----------------------------------------------------------------

export function decomposeChiitoitsu(tiles: Tile[]): ChiitoitsuDecomposition | null {
  if (tiles.length !== 14) return null;
  const sorted = sortTiles(tiles);
  const pairs: Tile[][] = [];

  let i = 0;
  while (i < sorted.length) {
    if (i + 1 < sorted.length && sameTile(sorted[i], sorted[i + 1])) {
      // 同じ牌が3枚以上連続していたら七対子不成立 (4枚は対子2つとして扱わない)
      if (i + 2 < sorted.length && sameTile(sorted[i], sorted[i + 2])) {
        return null; // 3枚以上は七対子不可
      }
      pairs.push([sorted[i], sorted[i + 1]]);
      i += 2;
    } else {
      return null;
    }
  }

  if (pairs.length !== 7) return null;
  return { kind: "chiitoitsu", pairs };
}

// ---- 国士無双 --------------------------------------------------------------

export function decomposeKokushi(tiles: Tile[]): KokushiDecomposition | null {
  if (tiles.length !== 14) return null;

  const requiredNames = new Set(KOKUSHI_TILES);
  const tileNames = tiles.map((t) => t.name);

  // 13種の幺九牌がすべて揃っているか
  for (const req of requiredNames) {
    if (!tileNames.includes(req)) return null;
  }

  return { kind: "kokushi", tiles };
}

// ---- 全分解の取得 ----------------------------------------------------------

/**
 * 手牌からすべての有効な分解を返す。
 * preformedKantsu: 事前に確定した槓子 (index.ts で抽出済み)
 * 通常手・七対子・国士無双を網羅する (槓子がある場合は通常手のみ)。
 */
export function getAllDecompositions(tiles: Tile[], preformedKantsu: Mentsu[] = []): HandDecomposition[] {
  const results: HandDecomposition[] = [];

  // 通常手
  results.push(...decomposeNormal(tiles, preformedKantsu));

  // 槓子がある場合は七対子・国士無双は不成立
  if (preformedKantsu.length === 0) {
    const chiitoi = decomposeChiitoitsu(tiles);
    if (chiitoi) results.push(chiitoi);

    const kokushi = decomposeKokushi(tiles);
    if (kokushi) results.push(kokushi);
  }

  return results;
}
