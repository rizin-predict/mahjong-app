"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuHanLabel = void 0;
exports.calcScore = calcScore;
const tiles_1 = require("./tiles");
const decompose_1 = require("./decompose");
const yaku_1 = require("./yaku");
const fu_1 = require("./fu");
const score_1 = require("./score");
// ============================================================
// メインのスコア計算関数
// ============================================================
/**
 * 手牌と条件から役・符・点数を計算して返す。
 *
 * @example
 * ```ts
 * const result = calcScore({
 *   tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1z","1z","1z","5z","5z"],
 *   winningTile: "9m",
 *   isTsumo: true,
 *   seatWind: 1,
 *   roundWind: 1,
 * });
 * console.log(result.yaku, result.han, result.fu, result.payment);
 * ```
 */
function calcScore(input) {
    // 牌をパース
    let allTiles;
    try {
        allTiles = (0, tiles_1.parseTiles)(input.tiles);
    }
    catch (e) {
        return invalidResult(e.message);
    }
    if (allTiles.length !== 14) {
        return invalidResult(`牌の枚数が正しくありません: ${allTiles.length}枚 (14枚必要)`);
    }
    let winTile;
    try {
        winTile = (0, tiles_1.parseTile)(input.winningTile);
    }
    catch (e) {
        return invalidResult(e.message);
    }
    // winningTile が tiles に含まれるか確認
    const winIdx = allTiles.findIndex((t) => t.suit === winTile.suit && t.value === winTile.value);
    if (winIdx === -1) {
        return invalidResult(`あがり牌 ${input.winningTile} が手牌に含まれていません`);
    }
    // ドラ計算
    let doraCount = 0;
    if (input.doraIndicators && input.doraIndicators.length > 0) {
        try {
            const doraIndicatorTiles = (0, tiles_1.parseTiles)(input.doraIndicators);
            doraCount = (0, tiles_1.countDora)(allTiles, doraIndicatorTiles);
        }
        catch (e) {
            return invalidResult(`ドラ表示牌エラー: ${e.message}`);
        }
    }
    // 全ての分解を取得
    const decompositions = (0, decompose_1.getAllDecompositions)(allTiles);
    if (decompositions.length === 0) {
        return invalidResult("有効な上がり形ではありません");
    }
    // 各分解で役・符・点数を計算し、最高点を採用
    let bestResult = null;
    for (const decomp of decompositions) {
        const candidate = evaluateDecomposition(decomp, input, winTile, doraCount, allTiles);
        if (!candidate.isValid)
            continue;
        if (!bestResult || candidate.basicPoints > bestResult.basicPoints) {
            bestResult = candidate;
        }
        // 同点の場合は翻数が多い方を優先
        if (bestResult && candidate.basicPoints === bestResult.basicPoints && candidate.han > bestResult.han) {
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
function evaluateDecomposition(decomp, input, winTile, doraCount, allTiles) {
    const isDealer = input.seatWind === 1;
    if (decomp.kind === "normal") {
        return evaluateNormal(decomp, input, winTile, doraCount, isDealer);
    }
    else if (decomp.kind === "chiitoitsu") {
        return evaluateChiitoitsu(decomp, input, winTile, doraCount, isDealer, allTiles);
    }
    else {
        return evaluateKokushi(input, doraCount, isDealer);
    }
}
function evaluateNormal(decomp, input, winTile, doraCount, isDealer) {
    const yaku = (0, yaku_1.getYakuForNormal)(decomp, input, winTile);
    if (!(0, yaku_1.hasValidYaku)(yaku)) {
        return invalidResult("役なし");
    }
    const isYakuman = yaku.some((y) => y.isYakuman);
    const hasPinfu = yaku.some((y) => y.nameJp === "平和");
    const fu = (0, fu_1.calcFuNormal)(decomp, input, winTile, hasPinfu);
    // 翻数計算 (役満は13翻固定)
    let han;
    if (isYakuman) {
        han = 13;
    }
    else {
        const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
        han = yaku.reduce((sum, y) => {
            if (isOpen && y.hanOpen !== undefined)
                return sum + y.hanOpen;
            return sum + y.han;
        }, 0) + doraCount;
    }
    const basicPoints = (0, score_1.calcBasicPoints)(han, fu);
    const payment = (0, score_1.calcPayment)(basicPoints, isDealer, input.isTsumo);
    return {
        isValid: true,
        decomposition: decomp,
        yaku: yaku.map((y) => {
            const isOpen = !!(input.openMentsu && input.openMentsu.length > 0);
            const hanVal = isOpen && y.hanOpen !== undefined ? y.hanOpen : y.han;
            return { nameJp: y.nameJp, han: hanVal };
        }),
        dora: doraCount,
        han,
        fu,
        basicPoints,
        payment,
    };
}
function evaluateChiitoitsu(decomp, input, _winTile, doraCount, isDealer, _allTiles) {
    const yaku = (0, yaku_1.getYakuForChiitoitsu)(input);
    if (!(0, yaku_1.hasValidYaku)(yaku)) {
        return invalidResult("役なし");
    }
    const fu = (0, fu_1.calcFuChiitoitsu)();
    const han = yaku.reduce((sum, y) => sum + y.han, 0) + doraCount;
    const basicPoints = (0, score_1.calcBasicPoints)(han, fu);
    const payment = (0, score_1.calcPayment)(basicPoints, isDealer, input.isTsumo);
    return {
        isValid: true,
        decomposition: decomp,
        yaku: yaku.map((y) => ({ nameJp: y.nameJp, han: y.han })),
        dora: doraCount,
        han,
        fu,
        basicPoints,
        payment,
    };
}
function evaluateKokushi(input, _doraCount, isDealer) {
    const yaku = (0, yaku_1.getYakuForKokushi)(input);
    const fu = (0, fu_1.calcFuKokushi)();
    const han = 13;
    const basicPoints = (0, score_1.calcBasicPoints)(han, fu);
    const payment = (0, score_1.calcPayment)(basicPoints, isDealer, input.isTsumo);
    return {
        isValid: true,
        yaku: yaku.map((y) => ({ nameJp: y.nameJp, han: y.han })),
        dora: 0,
        han,
        fu,
        basicPoints,
        payment,
    };
}
// ============================================================
// ヘルパー
// ============================================================
function invalidResult(error) {
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
// ============================================================
// 再エクスポート (利便性のため)
// ============================================================
var score_2 = require("./score");
Object.defineProperty(exports, "fuHanLabel", { enumerable: true, get: function () { return score_2.fuHanLabel; } });
//# sourceMappingURL=index.js.map