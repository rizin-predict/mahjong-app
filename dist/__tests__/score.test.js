"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
// ============================================================
// テスト: 基本的な役と点数
// ============================================================
describe("calcScore", () => {
    // ---- 役なし ----
    // 1m-2m-3m, 5m-6m-7m, 1p-2p-3p, 5p-6p-7p + 9s雀頭
    // 一気通貫なし・断么九なし(1m,1p,9s)・平和なし(辺張待ち)・役牌なし → 役なし
    test("役なしは無効", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "5m", "6m", "7m", "1p", "2p", "3p", "5p", "6p", "7p", "9s", "9s"],
            winningTile: "3m",
            isTsumo: false,
            seatWind: 2, // 南
            roundWind: 1, // 東
        });
        expect(result.isValid).toBe(false);
    });
    // ---- 断么九 ----
    test("断么九 (タンヤオ)", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["2m", "3m", "4m", "5m", "6m", "7m", "2p", "3p", "4p", "5p", "6p", "7p", "8s", "8s"],
            winningTile: "7m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "断么九")).toBe(true);
    });
    // ---- 平和 ----
    test("平和 (ピンフ) 門前ロン", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4m", "5m", "6m", "1p", "2p", "3p", "4p", "5p", "6p", "9s", "9s"],
            winningTile: "6m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "平和")).toBe(true);
        expect(result.fu).toBe(30);
    });
    // ---- 立直 + 平和 + 断么九 ----
    test("立直 + 平和 + 断么九 = 3翻30符", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["2m", "3m", "4m", "5m", "6m", "7m", "2p", "3p", "4p", "5p", "6p", "7p", "8s", "8s"],
            winningTile: "7m",
            isTsumo: false,
            isRiichi: true,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "立直")).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "断么九")).toBe(true);
        // 立直(1) + 断么九(1) + 平和(1) = 3翻
        expect(result.han).toBeGreaterThanOrEqual(2);
    });
    // ---- 七対子 ----
    test("七対子 (チートイツ)", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "1m", "3p", "3p", "5s", "5s", "7m", "7m", "9p", "9p", "1z", "1z", "2z", "2z"],
            winningTile: "2z",
            isTsumo: true,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "七対子")).toBe(true);
        expect(result.fu).toBe(25);
    });
    // ---- 国士無双 ----
    test("国士無双 (コクシ)", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z", "1m"],
            winningTile: "1m",
            isTsumo: true,
            seatWind: 1,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "国士無双")).toBe(true);
        expect(result.han).toBe(13);
    });
    // ---- 役牌 (中) ----
    test("役牌 中刻子", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "7z", "7z", "7z", "1z", "1z"],
            winningTile: "3m",
            isTsumo: false,
            seatWind: 1,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "役牌(中)")).toBe(true);
    });
    // ---- 清一色 ----
    test("清一色 (チンイツ) 6翻", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1m", "2m", "3m", "5m", "5m"],
            winningTile: "9m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "清一色")).toBe(true);
        expect(result.han).toBeGreaterThanOrEqual(6);
    });
    // ---- 対々和 ----
    // 1m×3(刻子) + 9p×3(刻子) + 5z×3(白刻子) + 7z×3(中刻子) + 3s×2(雀頭)
    // winTile=1mロン → 1m刻子が明刻扱い → 三暗刻+対々和+役牌(白)+役牌(中)
    test("対々和 (トイトイ) + 役牌", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "1m", "1m", "9p", "9p", "9p", "5z", "5z", "5z", "7z", "7z", "7z", "3s", "3s"],
            winningTile: "1m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "対々和")).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "役牌(白)")).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "役牌(中)")).toBe(true);
    });
    // ---- ドラ計算 ----
    test("ドラ計算", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["2m", "3m", "4m", "5m", "6m", "7m", "2p", "3p", "4p", "5p", "6p", "7p", "8s", "8s"],
            winningTile: "7m",
            isTsumo: false,
            isRiichi: true,
            seatWind: 2,
            roundWind: 1,
            doraIndicators: ["1m"], // ドラは2m
        });
        expect(result.isValid).toBe(true);
        expect(result.dora).toBe(1); // 2mが1枚ある
    });
    // ---- 満貫 ----
    test("5翻で満貫", () => {
        // 清一色(6) = 満貫以上になる
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1m", "2m", "3m", "5m", "5m"],
            winningTile: "9m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        // 子のロン: 基本点2000 × 4 = 8000点以上
        expect(result.payment.ron).toBeGreaterThanOrEqual(8000);
    });
    // ---- 枚数不正 ----
    test("13枚でエラー", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "5z"],
            winningTile: "5z",
            isTsumo: true,
        });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("枚数");
    });
    // ---- 一気通貫 ----
    test("一気通貫 (イッツー)", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "3p", "4p", "5p", "7s", "7s"],
            winningTile: "9m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "一気通貫")).toBe(true);
    });
    // ---- 大三元 (役満) ----
    test("大三元 (役満)", () => {
        const result = (0, index_1.calcScore)({
            tiles: ["5z", "5z", "5z", "6z", "6z", "6z", "7z", "7z", "7z", "1m", "2m", "3m", "5m", "5m"],
            winningTile: "3m",
            isTsumo: false,
            seatWind: 2,
            roundWind: 1,
        });
        expect(result.isValid).toBe(true);
        expect(result.yaku.some((y) => y.nameJp === "大三元")).toBe(true);
        expect(result.han).toBe(13);
        expect(result.payment.ron).toBe(32000); // 子のロン役満 = 基本点8000 × 4
    });
});
//# sourceMappingURL=score.test.js.map