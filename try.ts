import { calcScore, fuHanLabel } from "./src/index";

const result = calcScore({
  tiles: ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1m","2m","3m","5m","5m"],
  winningTile: "9m",
  isTsumo: false,
}, 2, 1); // 自風: 南, 場風: 東

if (!result.isValid) {
  console.log("無効:", result.error);
} else {
  console.log("=== 役 ===");
  result.yaku.forEach((y) => console.log(`  ${y.nameJp}: ${y.han}翻`));
  if (result.dora > 0) console.log(`  ドラ: ${result.dora}`);
  console.log(`=== ${fuHanLabel(result.han, result.fu)} ===`);
  if (result.payment.ron !== undefined) console.log(`ロン: ${result.payment.ron}点`);
  if (result.payment.nonDealerTsumo) {
    const t = result.payment.nonDealerTsumo;
    console.log(`ツモ: 親${t.dealer}点 / 子${t.nonDealer}点`);
  }
}
