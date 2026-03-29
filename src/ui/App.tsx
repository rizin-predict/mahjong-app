import React, { useState } from "react";
import { calcScore, fuHanLabel } from "../index";
import { calcBasicPoints, calcPayment } from "../score";
import type { ScoringResult, Wind } from "../types";

// ── 牌の絵文字マッピング ──────────────────────────────────────────
const EMOJI: Record<string, string> = {
  "1m":"🀇","2m":"🀈","3m":"🀉","4m":"🀊","5m":"🀋","6m":"🀌","7m":"🀍","8m":"🀎","9m":"🀏",
  "1p":"🀙","2p":"🀚","3p":"🀛","4p":"🀜","5p":"🀝","6p":"🀞","7p":"🀟","8p":"🀠","9p":"🀡",
  "1s":"🀐","2s":"🀑","3s":"🀒","4s":"🀓","5s":"🀔","6s":"🀕","7s":"🀖","8s":"🀗","9s":"🀘",
  "1z":"🀀","2z":"🀁","3z":"🀂","4z":"🀃","5z":"🀆","6z":"🀅","7z":"🀄",
};
const LABEL: Record<string, string> = {
  "1m":"一萬","2m":"二萬","3m":"三萬","4m":"四萬","5m":"五萬","6m":"六萬","7m":"七萬","8m":"八萬","9m":"九萬",
  "1p":"一筒","2p":"二筒","3p":"三筒","4p":"四筒","5p":"五筒","6p":"六筒","7p":"七筒","8p":"八筒","9p":"九筒",
  "1s":"一索","2s":"二索","3s":"三索","4s":"四索","5s":"五索","6s":"六索","7s":"七索","8s":"八索","9s":"九索",
  "1z":"東","2z":"南","3z":"西","4z":"北","5z":"白","6z":"發","7z":"中",
};
const PALETTE = [
  { label: "萬子", tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m"] },
  { label: "筒子", tiles: ["1p","2p","3p","4p","5p","6p","7p","8p","9p"] },
  { label: "索子", tiles: ["1s","2s","3s","4s","5s","6s","7s","8s","9s"] },
  { label: "字牌", tiles: ["1z","2z","3z","4z","5z","6z","7z"] },
];
const WIND_LABELS: Record<number, string> = { 1: "東", 2: "南", 3: "西", 4: "北" };

// ── 副露の型 ──────────────────────────────────────────────────────
type MeldType = "chi" | "pon" | "ankan" | "minkan";
interface OpenMeld { type: MeldType; tiles: string[] }

// ── 理牌ソート ────────────────────────────────────────────────────
const SUIT_ORDER: Record<string, number> = { m: 0, p: 1, s: 2, z: 3 };

function sortHandTiles(tiles: string[]): string[] {
  return [...tiles].sort((a, b) => {
    const sA = SUIT_ORDER[a.slice(-1)] ?? 99;
    const sB = SUIT_ORDER[b.slice(-1)] ?? 99;
    if (sA !== sB) return sA - sB;
    return parseInt(a) - parseInt(b);
  });
}

// ── チー判定 ──────────────────────────────────────────────────────
function isSequential(tiles: string[]): boolean {
  if (tiles.length !== 3) return false;
  const last = (t: string) => t.slice(-1);
  const val  = (t: string) => parseInt(t.slice(0, -1));
  if (tiles.some(t => last(t) === "z")) return false;
  if (!tiles.every(t => last(t) === last(tiles[0]))) return false;
  const vals = tiles.map(val).sort((a, b) => a - b);
  return vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1;
}
function isAllSame(tiles: string[]): boolean {
  return tiles.length >= 2 && tiles.every(t => t === tiles[0]);
}

// ── スタイル ──────────────────────────────────────────────────────
const S = {
  card: (highlight = false): React.CSSProperties => ({
    background: highlight ? "rgba(255,165,0,0.1)" : "rgba(255,255,255,0.07)",
    border: highlight ? "1px solid rgba(255,165,0,0.4)" : "1px solid transparent",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 12,
  }),
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#a8c8a8",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  tileBtn: (selected: boolean, isWin: boolean, inBuffer: boolean): React.CSSProperties => ({
    fontSize: 28,
    lineHeight: 1,
    padding: "4px 3px",
    border: isWin ? "2px solid #ffd700"
          : inBuffer ? "2px solid #ff9800"
          : selected ? "2px solid #6dbf6d"
          : "2px solid transparent",
    borderRadius: 6,
    background: isWin ? "rgba(255,215,0,0.15)"
              : inBuffer ? "rgba(255,152,0,0.15)"
              : selected ? "rgba(109,191,109,0.15)"
              : "transparent",
    cursor: "pointer",
    color: "inherit",
  }),
  slot: (filled: boolean, highlight: boolean): React.CSSProperties => ({
    width: 44,
    height: 58,
    border: highlight ? "2px solid #ffd700"
          : filled    ? "2px solid rgba(255,255,255,0.25)"
          :              "2px dashed rgba(255,255,255,0.18)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    cursor: filled ? "pointer" : "default",
    background: highlight ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)",
    flexShrink: 0,
    position: "relative",
  }),
  chip: (active: boolean, color = "#4caf50"): React.CSSProperties => ({
    padding: "5px 14px",
    borderRadius: 20,
    border: "none",
    background: active ? color : "rgba(255,255,255,0.12)",
    color: active ? "#fff" : "#ccc",
    cursor: "pointer",
    fontWeight: active ? 700 : 400,
    fontSize: 14,
  }),
  actionBtn: (color: string, disabled = false): React.CSSProperties => ({
    padding: "6px 16px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "rgba(255,255,255,0.08)" : color,
    color: disabled ? "#555" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: 14,
  }),
  meldRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  } as React.CSSProperties,
};

// ── メインコンポーネント ───────────────────────────────────────────
export default function App() {
  // 手牌 (門前)
  const [handTiles, setHandTiles] = useState<string[]>([]);
  // 副露済み面子
  const [openMelds, setOpenMelds] = useState<OpenMeld[]>([]);
  // 副露追加モード
  const [addingMeld, setAddingMeld] = useState(false);
  const [meldBuffer, setMeldBuffer] = useState<string[]>([]);

  const [winTile, setWinTile]         = useState("");
  const [isTsumo, setIsTsumo]         = useState(false);
  const [isRiichi, setIsRiichi]       = useState(false);
  const [isDblRiichi, setIsDblRiichi] = useState(false);
  const [isIppatsu, setIsIppatsu]     = useState(false);
  const [isHaitei, setIsHaitei]       = useState(false);
  const [seatWind, setSeatWind]       = useState<Wind>(2);
  const [roundWind, setRoundWind]     = useState<Wind>(1);
  const [doraCount, setDoraCount]     = useState(0);
  const [result, setResult]           = useState<ScoringResult | null>(null);

  // ── 派生値 ──────────────────────────────────────────────────────
  const kanCount          = openMelds.filter(m => m.type === "ankan" || m.type === "minkan").length;
  const maxTotalTiles     = 14 + kanCount;
  const openMeldTileCount = openMelds.reduce((s, m) => s + m.tiles.length, 0);
  const maxHandTiles      = maxTotalTiles - openMeldTileCount;
  const totalTiles        = handTiles.length + openMeldTileCount;

  // 全使用牌カウント (パレットの上限表示用)
  const usedCounts: Record<string, number> = {};
  [...handTiles, ...meldBuffer, ...openMelds.flatMap(m => m.tiles)]
    .forEach(t => { usedCounts[t] = (usedCounts[t] ?? 0) + 1; });

  // 副露バッファの検証
  const canPon = isAllSame(meldBuffer) && meldBuffer.length === 3;
  const canChi = isSequential(meldBuffer) && meldBuffer.length === 3;
  const canKan = isAllSame(meldBuffer) && meldBuffer.length === 4;
  const meldValid = canPon || canChi || canKan;

  // 暗槓のみなら立直可。チー・ポン・明槓があれば立直不可
  const hasOpenMelds = openMelds.some(m => m.type === "chi" || m.type === "pon" || m.type === "minkan");

  // ── アクション ──────────────────────────────────────────────────
  const onPaletteTile = (tile: string) => {
    if ((usedCounts[tile] ?? 0) >= 4) return;
    if (addingMeld) {
      if (meldBuffer.length >= 4) return;
      setMeldBuffer(p => [...p, tile]);
    } else {
      if (handTiles.length >= maxHandTiles) return;
      setHandTiles(p => sortHandTiles([...p, tile]));
      setResult(null);
    }
  };

  const removeHandTile = (i: number) => {
    const removed = handTiles[i];
    const next = sortHandTiles(handTiles.filter((_, j) => j !== i));
    setHandTiles(next);
    if (winTile === removed && !next.includes(removed)) setWinTile("");
    setResult(null);
  };

  const toggleWinTile = (tile: string) => {
    setWinTile(p => p === tile ? "" : tile);
    setResult(null);
  };

  const removeMeldBufferTile = (i: number) => {
    setMeldBuffer(p => p.filter((_, j) => j !== i));
  };

  const confirmMeld = (type: MeldType) => {
    setOpenMelds(p => [...p, { type, tiles: [...meldBuffer] }]);
    setMeldBuffer([]);
    setAddingMeld(false);
    setResult(null);
    // チー・ポン・明槓は立直不可 (暗槓はリーチ後も可)
    if (type !== "ankan") { setIsRiichi(false); setIsDblRiichi(false); setIsIppatsu(false); }
  };

  const cancelMeld = () => { setMeldBuffer([]); setAddingMeld(false); };

  const removeOpenMeld = (i: number) => {
    setOpenMelds(p => p.filter((_, j) => j !== i));
    setResult(null);
  };

  const clearAll = () => {
    setHandTiles([]); setOpenMelds([]); setMeldBuffer([]);
    setWinTile(""); setAddingMeld(false); setResult(null);
  };

  const canCalc = totalTiles === maxTotalTiles && winTile !== "" && !addingMeld;

  const calculate = () => {
    const allTiles = [...handTiles, ...openMelds.flatMap(m => m.tiles)];
    const res = calcScore({
      tiles: allTiles,
      winningTile: winTile,
      isTsumo,
      isRiichi,
      isDoubleRiichi: isDblRiichi,
      isIppatsu,
      isHaitei,
      doraIndicators: [],
      openMentsu: openMelds,
    }, seatWind, roundWind);
    if (res.isValid && doraCount > 0) {
      res.dora = (res.dora ?? 0) + doraCount;
      res.han  += doraCount;
      res.basicPoints = calcBasicPoints(res.han, res.fu, res.yakumanMultiplier);
      res.payment = calcPayment(res.basicPoints, seatWind === 1, isTsumo);
    }
    setResult(res);
  };

  // ── レンダリング ────────────────────────────────────────────────
  return (
    <div>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", padding: "16px 0 12px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.1em", color: "#f0ead6" }}>
          🀄 麻雀点数計算
        </h1>
      </div>

      {/* パレット */}
      <div style={S.card(addingMeld)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.sectionTitle}>
            {addingMeld ? "▶ 副露する牌を選択" : "牌を選択（タップで追加）"}
          </div>
          {addingMeld && (
            <span style={{ fontSize: 12, color: "#ff9800" }}>
              {meldBuffer.length}/{ canKan ? 4 : 3 } 枚選択中
            </span>
          )}
        </div>
        {PALETTE.map(({ label, tiles }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#888", width: 32, flexShrink: 0 }}>{label}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {tiles.map(tile => {
                const cnt     = usedCounts[tile] ?? 0;
                const bufCnt  = meldBuffer.filter(t => t === tile).length;
                const paletteMax = addingMeld ? 4 : maxHandTiles;
                const current    = addingMeld ? meldBuffer.length : handTiles.length;
                const disabled   = cnt >= 4 || current >= paletteMax;
                return (
                  <button
                    key={tile}
                    title={LABEL[tile]}
                    onClick={() => !disabled && onPaletteTile(tile)}
                    style={{
                      ...S.tileBtn(cnt > 0, winTile === tile, bufCnt > 0),
                      opacity: disabled ? 0.3 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {EMOJI[tile]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 手牌エリア */}
      <div style={S.card()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.sectionTitle}>
            手牌 ({handTiles.length}/{maxHandTiles})
            {totalTiles === maxTotalTiles && winTile === "" && (
              <span style={{ color: "#ffd700", marginLeft: 8, fontWeight: 400 }}>← あがり牌をタップ</span>
            )}
          </div>
          {(handTiles.length > 0 || openMelds.length > 0) && (
            <button onClick={clearAll} style={{ fontSize: 12, color: "#f88", background: "none", border: "none", cursor: "pointer" }}>
              全消し
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: maxHandTiles }).map((_, i) => {
            const tile  = handTiles[i];
            const isWin = !!tile && tile === winTile;
            return (
              <div
                key={i}
                style={S.slot(!!tile, isWin)}
                onClick={() => {
                  if (!tile) return;
                  if (totalTiles === maxTotalTiles) toggleWinTile(tile);
                  else removeHandTile(i);
                }}
                title={tile ? (totalTiles === maxTotalTiles ? `${LABEL[tile]}をあがり牌に設定` : `${LABEL[tile]}を削除`) : ""}
              >
                {tile ? EMOJI[tile] : ""}
                {isWin && (
                  <div style={{ position: "absolute", bottom: 1, left: 0, right: 0, textAlign: "center", fontSize: 8, color: "#ffd700", fontWeight: 700 }}>
                    WIN
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {handTiles.length > 0 && totalTiles < 14 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>タップして牌を削除</div>
        )}
      </div>

      {/* 副露エリア */}
      <div style={S.card()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.sectionTitle}>
            副露 {openMelds.length > 0 ? `(${openMelds.length}面子)` : ""}
          </div>
          {!addingMeld && (
            <button
              onClick={() => { setMeldBuffer([]); setAddingMeld(true); }}
              disabled={totalTiles >= maxTotalTiles}
              style={S.actionBtn("#ff9800", totalTiles >= maxTotalTiles)}
            >
              ＋ 副露を追加
            </button>
          )}
        </div>

        {/* 副露済み面子リスト */}
        {openMelds.map((meld, i) => (
          <div key={i} style={S.meldRow}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#fff",
              background: meld.type === "ankan" ? "#6a1b9a"
                        : meld.type === "minkan" ? "#9c27b0"
                        : meld.type === "pon"    ? "#1976d2"
                        :                          "#388e3c",
              borderRadius: 4, padding: "2px 6px", flexShrink: 0,
            }}>
              {meld.type === "chi" ? "チー"
               : meld.type === "pon" ? "ポン"
               : meld.type === "ankan" ? "暗槓"
               : "明槓"}
            </span>
            <div style={{ display: "flex", gap: 2 }}>
              {meld.tiles.map((t, j) => (
                <span key={j} style={{ fontSize: 26 }}>{EMOJI[t]}</span>
              ))}
            </div>
            <button
              onClick={() => removeOpenMeld(i)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#f88", cursor: "pointer", fontSize: 16 }}
            >✕</button>
          </div>
        ))}

        {/* 副露ビルダー */}
        {addingMeld && (
          <div style={{ marginTop: 8, padding: "12px", background: "rgba(255,152,0,0.08)", borderRadius: 8, border: "1px solid rgba(255,152,0,0.3)" }}>
            {/* バッファ表示 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, minHeight: 52, alignItems: "center" }}>
              {meldBuffer.length === 0 && (
                <span style={{ fontSize: 13, color: "#888" }}>上のパレットから牌を選んでください</span>
              )}
              {meldBuffer.map((t, i) => (
                <div
                  key={i}
                  onClick={() => removeMeldBufferTile(i)}
                  title={`${LABEL[t]}を削除`}
                  style={{ ...S.slot(true, false), cursor: "pointer", border: "2px solid #ff9800" }}
                >
                  <span style={{ fontSize: 28 }}>{EMOJI[t]}</span>
                </div>
              ))}
              {meldBuffer.length > 0 && meldBuffer.length < 4 && (
                <span style={{ fontSize: 11, color: "#888" }}>← タップで削除</span>
              )}
            </div>

            {/* バリデーションメッセージ */}
            {meldBuffer.length > 0 && !meldValid && (
              <div style={{ fontSize: 12, color: "#ff9800", marginBottom: 8 }}>
                {meldBuffer.length === 3
                  ? "ポン (3枚同じ) またはチー (3枚連番) にしてください"
                  : meldBuffer.length === 4
                  ? "カン (4枚同じ) にしてください"
                  : "牌を選んでください"}
              </div>
            )}

            {/* 確定ボタン */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={!canPon}
                onClick={() => confirmMeld("pon")}
                style={S.actionBtn("#1976d2", !canPon)}
              >ポン</button>
              <button
                disabled={!canChi}
                onClick={() => confirmMeld("chi")}
                style={S.actionBtn("#388e3c", !canChi)}
              >チー</button>
              <button
                disabled={!canKan}
                onClick={() => confirmMeld("ankan")}
                style={S.actionBtn("#6a1b9a", !canKan)}
              >暗槓</button>
              <button
                disabled={!canKan}
                onClick={() => confirmMeld("minkan")}
                style={S.actionBtn("#9c27b0", !canKan)}
              >明槓</button>
              <button
                onClick={cancelMeld}
                style={{ ...S.actionBtn("rgba(255,255,255,0.15)"), marginLeft: "auto" }}
              >キャンセル</button>
            </div>
          </div>
        )}

        {openMelds.length === 0 && !addingMeld && (
          <div style={{ fontSize: 13, color: "#555" }}>副露なし (門前)</div>
        )}
      </div>

      {/* オプション */}
      <div style={S.card()}>
        <div style={S.sectionTitle}>オプション</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>あがり</span>
          <button style={S.chip(!isTsumo)} onClick={() => setIsTsumo(false)}>ロン</button>
          <button style={S.chip(isTsumo)}  onClick={() => setIsTsumo(true)}>ツモ</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>立直</span>
          {hasOpenMelds ? (
            <span style={{ fontSize: 13, color: "#555" }}>副露手は立直不可</span>
          ) : (
            <>
              <button style={S.chip(!isRiichi && !isDblRiichi)} onClick={() => { setIsRiichi(false); setIsDblRiichi(false); setIsIppatsu(false); }}>なし</button>
              <button style={S.chip(isRiichi && !isDblRiichi)} onClick={() => { setIsRiichi(true); setIsDblRiichi(false); }}>立直</button>
              <button style={S.chip(isDblRiichi)} onClick={() => { setIsRiichi(false); setIsDblRiichi(true); }}>ダブ立直</button>
              {(isRiichi || isDblRiichi) && (
                <button style={S.chip(isIppatsu)} onClick={() => setIsIppatsu(p => !p)}>一発</button>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>その他</span>
          <button style={S.chip(isHaitei)} onClick={() => setIsHaitei(p => !p)}>
            {isTsumo ? "海底" : "河底"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>自風</span>
          {([1,2,3,4] as Wind[]).map(w => (
            <button key={w} style={S.chip(seatWind === w)} onClick={() => setSeatWind(w)}>{WIND_LABELS[w]}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>場風</span>
          {([1,2,3,4] as Wind[]).map(w => (
            <button key={w} style={S.chip(roundWind === w)} onClick={() => setRoundWind(w)}>{WIND_LABELS[w]}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#aaa", minWidth: 60 }}>ドラ</span>
          <button style={{ ...S.chip(false), padding: "5px 10px" }} onClick={() => setDoraCount(p => Math.max(0, p - 1))}>－</button>
          <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{doraCount}</span>
          <button style={{ ...S.chip(false), padding: "5px 10px" }} onClick={() => setDoraCount(p => Math.min(16, p + 1))}>＋</button>
          <span style={{ fontSize: 12, color: "#888" }}>枚</span>
        </div>
      </div>

      {/* 計算ボタン */}
      <button
        style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
          background: canCalc ? "#4caf50" : "rgba(255,255,255,0.1)",
          color: canCalc ? "#fff" : "#555",
          fontSize: 17, fontWeight: 700, cursor: canCalc ? "pointer" : "not-allowed",
          marginBottom: 12,
        }}
        disabled={!canCalc}
        onClick={calculate}
      >
        {addingMeld ? "副露追加中..." :
         totalTiles < maxTotalTiles ? `牌があと ${maxTotalTiles - totalTiles} 枚必要` :
         !winTile ? "あがり牌を選択してください" : "点数を計算する"}
      </button>

      {/* 結果 */}
      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ── 結果パネル ────────────────────────────────────────────────────
function ResultPanel({ result }: { result: ScoringResult }) {
  if (!result.isValid) {
    return (
      <div style={{ ...S.card(), borderLeft: "4px solid #f44" }}>
        <div style={{ color: "#f88", fontWeight: 700, marginBottom: 4 }}>役なし / 無効</div>
        <div style={{ color: "#ccc", fontSize: 14 }}>{result.error}</div>
      </div>
    );
  }

  const isYakuman   = !!result.yakumanMultiplier;
  const accentColor = isYakuman ? "#ffd700" : "#4caf50";
  const p = result.payment;

  const totalScore = p.ron
    ?? (p.dealerTsumo ? p.dealerTsumo.all * 3
      : p.nonDealerTsumo ? p.nonDealerTsumo.dealer + p.nonDealerTsumo.nonDealer * 2 : 0);

  const scoreLines: string[] = [];
  if (p.ron !== undefined) scoreLines.push(`ロン: ${p.ron.toLocaleString()}点`);
  if (p.dealerTsumo) scoreLines.push(`ツモ: 子から各 ${p.dealerTsumo.all.toLocaleString()}点`);
  if (p.nonDealerTsumo) scoreLines.push(
    `ツモ: 親から ${p.nonDealerTsumo.dealer.toLocaleString()}点 / 子から ${p.nonDealerTsumo.nonDealer.toLocaleString()}点`
  );

  return (
    <div style={{ ...S.card(), borderLeft: `4px solid ${accentColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: accentColor }}>
          {fuHanLabel(result.han, result.fu, result.yakumanMultiplier)}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
          {totalScore.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>点</span>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {result.yaku.map((y, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 15 }}>{y.nameJp}</span>
            <span style={{ fontSize: 14, color: "#aaa" }}>{y.han >= 13 ? "役満" : `${y.han}翻`}</span>
          </div>
        ))}
        {result.dora > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 15 }}>ドラ</span>
            <span style={{ fontSize: 14, color: "#aaa" }}>{result.dora}翻</span>
          </div>
        )}
      </div>

      {!isYakuman && (
        <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 14, color: "#aaa" }}>
          <span>符: <strong style={{ color: "#f0ead6" }}>{result.fu}</strong></span>
          <span>翻: <strong style={{ color: "#f0ead6" }}>{result.han}</strong></span>
          <span>基本点: <strong style={{ color: "#f0ead6" }}>{result.basicPoints}</strong></span>
        </div>
      )}

      <div style={{ fontSize: 13, color: "#88cc88" }}>
        {scoreLines.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}
