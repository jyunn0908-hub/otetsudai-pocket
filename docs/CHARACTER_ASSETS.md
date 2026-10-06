# 48×48ピクセルキャラクター（2026-10-07）

切り抜きに見えるというフィードバックに基づき、20姿を太いドット・短い手足・簡潔な表情へ描き直した。コンセプト画像は参考として保持し、そこから絵を切り抜いて使用しない。

## 素材と表示

- `dist/pets-pixel-normal.png`：通常コマ
- `dist/pets-pixel-idle.png`：閉じ目・踏み替え
- `dist/pets-pixel-joy.png`：笑顔・手足や翼を上げるコマ
- `dist/pixel-sprites.mjs`：48×48 Canvasへ補間なしで描画し、半透明の縁を二値化。結果をキャッシュする。
- `dist/growth-view.mjs`：既存IDを新しい表示へ対応付ける。

生成元PNGは大きな5列×4行アトラス。アプリの実表示は48×48のラスターで、96/144/192pxの整数倍に拡大する。原画の切り抜きをそのまま縮小表示していた旧方式は使用しない。旧 `characters*.png` は比較用に残すが、表示や新サービスワーカーの事前キャッシュから参照しない。

待機・喜びは目や手足を描き替えた別画像で、stepsアニメーションで切り替える。動きを減らす設定では静止。庭・育成・図鑑・見本で共通レンダラーを使用し、成長条件・保存ID・獲得記録には変更を加えない。

## 制作方法と最終プロンプト

built-in image_gen を使用。最初の詳細な候補は不採用。以下の単純化した新規生成と2種の差分を使用。

### 通常コマ

Generate a sprite sheet of extremely simple TRUE LOW RESOLUTION game pixel art. This is a fresh redesign, NOT a cutout of an illustration. Think tiny 1990s handheld virtual pets: each creature ONLY 20 to 28 pixels tall, VERY LARGE square pixel blocks, eyes just ONE or TWO black pixel squares, tiny 1-pixel mouth, short stubby feet. Flat 4-color fill + dark outline. No details smaller than a big square pixel. No glow, gradients, antialias, smooth vector curves, realistic drawing, texture, floating sparkles, text, grid lines, labels, ground or shadows. Genuine transparent alpha background.
Production grid EXACTLY 5 columns and 4 rows, equal square cells. Canvas 1200 x 960. Each cell 240 square pixels representing logical48x48. Each character occupies only centered inner 140x140 physical pixels (28x28 logical pixels), with generous 50px transparent margin ON ALL SIDES. Pixel blocks exactly5x5. This generous spacing is crucial. Plain cute round blobs decorated with species-defining SIMPLE silhouette shapes. No elaborate mature dragons or ornamental pets. SMALL, SIMPLE, CHUNKY and ICONIC.
20 cells in order:
1 egg cream/green; 2 cream round baby with tiny ears; 3 green sprout blob; 4 lavender tiny point-eared blob; 5 brown leaf-eared squirrel.
6 blue round four-foot turtle green shell; 7 purple small cat; 8 blue small winged dragon; 9 orange small fire chick; 10 white small cloud blob.
11 cream rabbit with long ears and tiny gold star; 12 brown squirrel big curled tail green leaf; 13 orange cream cat green scarf; 14 wide blue turtle green shell with four clearly visible blocky feet; 15 cream orange fox three short flame tails.
16 dark-purple cat big pointed ears violet tail; 17 blue dragon with TWO triangular wings and curled tail; 18 orange phoenix with TWO spread flame wings; 19 white cloud fairy gold halo; 20 gray blocky rock golem two mossy shoulders.
Consistent square pixel grid, no fine detail. Result should resemble sprites that a pixel artist deliberately places one square at a time, NOT a detailed illustration with a pixelation filter.

### 待機コマ

undefined

### 喜びコマ

undefined
