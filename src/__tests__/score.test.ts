import { calcScore } from "../index";

describe("calcScore", () => {
  // ---- 役なし ----
  test("役なしは無効", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","5m","6m","7m","1p","2p","3p","5p","6p","7p","9s","9s"],
      winningTile: "3m",
      isTsumo: false,
    }, 2, 1); // 自風: 南, 場風: 東
    expect(result.isValid).toBe(false);
  });

  // ---- 断么九 ----
  test("断么九 (タンヤオ)", () => {
    const result = calcScore({
      tiles: ["2m","3m","4m","5m","6m","7m","2p","3p","4p","5p","6p","7p","8s","8s"],
      winningTile: "7m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "断么九")).toBe(true);
  });

  // ---- 平和 ----
  test("平和 (ピンフ) 門前ロン", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","1p","2p","3p","4p","5p","6p","9s","9s"],
      winningTile: "6m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "平和")).toBe(true);
    expect(result.fu).toBe(30);
  });

  // ---- 立直 + 平和 + 断么九 ----
  test("立直 + 平和 + 断么九", () => {
    const result = calcScore({
      tiles: ["2m","3m","4m","5m","6m","7m","2p","3p","4p","5p","6p","7p","8s","8s"],
      winningTile: "7m",
      isTsumo: false,
      isRiichi: true,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "立直")).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "断么九")).toBe(true);
    expect(result.han).toBeGreaterThanOrEqual(2);
  });

  // ---- 七対子 ----
  test("七対子 (チートイツ)", () => {
    const result = calcScore({
      tiles: ["1m","1m","3p","3p","5s","5s","7m","7m","9p","9p","1z","1z","2z","2z"],
      winningTile: "2z",
      isTsumo: true,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "七対子")).toBe(true);
    expect(result.fu).toBe(25);
  });

  // ---- 国士無双 (通常) ----
  test("国士無双 (コクシ) 通常", () => {
    const result = calcScore({
      tiles: ["1m","1m","9m","1p","9p","1s","9s","1z","2z","3z","4z","5z","6z","7z"],
      winningTile: "7z",
      isTsumo: true,
    }, 1, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "国士無双")).toBe(true);
    expect(result.yakumanMultiplier).toBe(1);
  });

  // ---- 国士無双十三面待ち (ダブル役満) ----
  test("国士無双十三面待ち (ダブル役満)", () => {
    const result = calcScore({
      tiles: ["1m","9m","1p","9p","1s","9s","1z","2z","3z","4z","5z","6z","7z","1m"],
      winningTile: "1m",
      isTsumo: true,
    }, 1, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "国士無双十三面待ち")).toBe(true);
    expect(result.yakumanMultiplier).toBe(2);
  });

  // ---- 役牌 ----
  test("役牌 中刻子", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4p","5p","6p","7s","8s","9s","7z","7z","7z","1z","1z"],
      winningTile: "3m",
      isTsumo: false,
    }, 1, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "役牌(中)")).toBe(true);
  });

  // ---- 連風牌 (ダブ東) ----
  test("連風牌 東場・東家で東刻子は2翻", () => {
    // 東場(roundWind=1) 東家(seatWind=1) で東の刻子
    const result = calcScore({
      tiles: ["1m","2m","3m","4p","5p","6p","7s","8s","9s","1z","1z","1z","2z","2z"],
      winningTile: "3m",
      isTsumo: false,
    }, 1, 1); // seatWind=東, roundWind=東
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "役牌(場風)")).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "役牌(自風)")).toBe(true);
    expect(result.han).toBeGreaterThanOrEqual(2);
  });

  // ---- 連風牌の雀頭符 ----
  test("連風牌の雀頭は4符", () => {
    // 東場・東家 / 一気通貫 + 東東雀頭
    // fu: 基本30 + 雀頭(場風2+自風2=4) + 待ち0(両面) = 34 → 40符
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1p","2p","3p","1z","1z"],
      winningTile: "3p",
      isTsumo: false,
    }, 1, 1); // seatWind=東, roundWind=東
    expect(result.isValid).toBe(true);
    expect(result.fu).toBe(40);
  });

  // ---- 清一色 ----
  test("清一色 (チンイツ) 6翻", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1m","2m","3m","5m","5m"],
      winningTile: "9m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "清一色")).toBe(true);
    expect(result.han).toBeGreaterThanOrEqual(6);
  });

  // ---- 対々和 ----
  test("対々和 (トイトイ) + 役牌", () => {
    const result = calcScore({
      tiles: ["1m","1m","1m","9p","9p","9p","5z","5z","5z","7z","7z","7z","3s","3s"],
      winningTile: "1m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "対々和")).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "役牌(白)")).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "役牌(中)")).toBe(true);
  });

  // ---- ドラ計算 ----
  test("ドラ計算", () => {
    const result = calcScore({
      tiles: ["2m","3m","4m","5m","6m","7m","2p","3p","4p","5p","6p","7p","8s","8s"],
      winningTile: "7m",
      isTsumo: false,
      isRiichi: true,
      doraIndicators: ["1m"], // ドラは2m
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.dora).toBe(1);
  });

  // ---- 満貫 ----
  test("5翻で満貫", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1m","2m","3m","5m","5m"],
      winningTile: "9m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.payment.ron).toBeGreaterThanOrEqual(8000);
  });

  // ---- 枚数不正 ----
  test("13枚でエラー", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1p","2p","3p","5z"],
      winningTile: "5z",
      isTsumo: true,
    }, 2, 1);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("枚数");
  });

  // ---- 一気通貫 ----
  test("一気通貫 (イッツー)", () => {
    const result = calcScore({
      tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","3p","4p","5p","7s","7s"],
      winningTile: "9m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "一気通貫")).toBe(true);
  });

  // ---- 大三元 (役満) ----
  test("大三元 (役満)", () => {
    const result = calcScore({
      tiles: ["5z","5z","5z","6z","6z","6z","7z","7z","7z","1m","2m","3m","5m","5m"],
      winningTile: "3m",
      isTsumo: false,
    }, 2, 1);
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "大三元")).toBe(true);
    expect(result.han).toBe(13);
    expect(result.payment.ron).toBe(32000);
  });

  // ---- 四槓子 (役満) ----
  test("四槓子 (役満) 18枚", () => {
    // 4×暗槓 + 雀頭 = 18枚
    const result = calcScore({
      tiles: [
        "1m","1m","1m","1m",
        "2m","2m","2m","2m",
        "3m","3m","3m","3m",
        "4m","4m","4m","4m",
        "1z","1z",
      ],
      winningTile: "1z",
      isTsumo: true,
      openMentsu: [
        { type: "ankan", tiles: ["1m","1m","1m","1m"] },
        { type: "ankan", tiles: ["2m","2m","2m","2m"] },
        { type: "ankan", tiles: ["3m","3m","3m","3m"] },
        { type: "ankan", tiles: ["4m","4m","4m","4m"] },
      ],
    }, 1, 1); // 東場東家
    expect(result.isValid).toBe(true);
    expect(result.yaku.some((y) => y.nameJp === "四槓子")).toBe(true);
    expect(result.yakumanMultiplier).toBe(1);
    expect(result.han).toBe(13);
  });
});
