# キャラクター画像と表示

コンセプトは `assets/character-concept.png`。ユーザー指定に合わせ、丸い体・短い手足・簡単な装飾にデフォルメした。

`dist/characters.png` はゲーム用20姿の通常アトラス。`dist/characters-idle.png` は閉じ目と踏み替え、`dist/characters-joy.png` は喜んだ目と上げた手足・翼を描き替えた同配置のアトラス。いずれも1402×1122pxで、ピクセル単位で仕上げた48×48の完成素材とは区別する。描画は `growth-view.mjs` の矩形で切り出し、補間なしで表示。表示枠は48pxの整数倍（144/192px、履歴96px）。

`dist/characters.html` に10種類の最終形態の見本と「よろこぶ」ボタンを用意。進化先を先に見せないため、子供の育成画面から直接リンクしない。この見本はポイントや図鑑を変更しない。

動きは `steps(1,end)` でコマを保持する方式。待機中は通常絵から閉じ目・踏み替え絵へ切り替え、喜びでは喜び絵へ切り替えて段階的に2回ジャンプする。動きを減らす設定では通常絵で静止し、文言のみで気持ちを伝える。

## アニメーション差分の制作プロンプト

待機コマ:

> Use case: precise-object-edit. Asset: animation frame atlas for a pixel virtual-pet game. Edit the attached 5-column x 4-row transparent sprite atlas into an IDLE SECOND FRAME. Preserve exactly all 20 character identities, exact order, colors, scale, canvas size, transparent background, centered placement, and generous cell gutters. Change actual drawing pixels: close or half-close every visible character eye into a simple horizontal pixel blink; shift alternating front feet/paws by a few coarse pixels to create a tiny step; for winged characters fold or lower wings slightly; for egg, tilt the top by a few pixels while keeping the same shell design. Keep bodies in almost identical position so switching frames does not jump. Coarse modern pixel art, no antialiasing, no labels, no borders, no added objects, no stray pixels, no scenery. This is frame B paired with the supplied frame A, so identity consistency is the top priority.

喜びコマ:

> Use case: precise-object-edit. Asset: animation frame atlas for a pixel virtual-pet game. Edit the attached 5-column x 4-row transparent sprite atlas into a JOY FRAME. Preserve exactly all 20 identities, exact order, colors, scale, canvas size, transparent background, cell positions, and generous gutters. Redraw actual pixels for an excited pose: eyes become happy upward arcs or bright wide eyes; mouths become happy; lift both front paws/feet or alternate them clearly; tails tilt upward; rabbit ears bounce outward; turtle lifts one front foot while remaining clearly four-legged; dragons spread wings a little; phoenix raises wings; cloud fairy puffs expand; golem lifts both arms; egg gains a small visible zigzag crack but stays an egg. Keep each body centered near the original baseline and fully inside its cell. Coarse modern pixel art, no antialiasing, no labels, no borders, no motion lines, no added scenery or floating objects. This is frame C paired with supplied frame A; identity and cell registration are critical.

新規育成は2つの第1段階→6つの第2段階→10種の最終形態。各段階は候補内でランダム。旧IDと経路は保持し、既存の図鑑を読み込めるよう絵を対応付けた。日数・必要ポイント・権限は変更しない。

制作方法: built-in image_gen。以下が生成・修正プロンプト。

## 生成

Create ONE production game sprite atlas, PNG with transparent background. Use attached concept only as a visual reference for species, NOT as artwork to crop. Redesign into much simpler rounded friendly virtual-pet pixel art, coarse intentional pixels like a 1990s pocket pet, two-head-tall, readable eyes, 4-5 main colors plus simple shadow, no elaborate tiny ornamental detail. Dark cat, sky dragon, phoenix still slightly cool but friendly. EXACT regular grid 5 COLUMNS x 4 ROWS, every cell same square size, centered with generous transparent padding, no labels, text, borders, arrows, scenery or shadows outside creatures. 20 distinct sprites ONE per cell. Think each occupies a 32x32 or 48x48 low resolution pixel canvas enlarged with nearest neighbor. No antialiased/vector style. Baby small, juvenile medium, final larger and distinct silhouette.
Cell order row-major:
ROW1: (1) cream egg green spots; (2) tiny round neutral cream baby blob with stubby feet; (3) small green sprout round creature leaf on head; (4) small purple wisp creature with short ears; (5) medium brown forest creature leaf ears and curled tail.
ROW2: (1) medium blue water creature on FOUR legs small shell; (2) medium purple shadow cat pointed ears crescent tail; (3) medium blue sky creature with little wings and horns; (4) medium orange fire bird small wings; (5) medium white cloud spirit with a small star.
ROW3 FINALS: (1) light rabbit, cream long ears golden little star and fluffy tail; (2) forest squirrel brown round big curled leafy tail; (3) sunlit calico cat orange cream leaf scarf; (4) blue water TURTLE, broad green shell tiny flower, clearly FOUR feet and horizontal turtle silhouette; (5) fire fox cream orange with 3 simple flame tails.
ROW4 FINALS: (1) dark cat dark purple, pointed ears, fluffy crescent tail simple violet aura; (2) sky dragon blue white, rounded body larger wings small horns long curled tail; (3) phoenix red orange gold spread big wings, friendly eyes, clear bird feet; (4) cloud fairy white pale blue fluffy round cloud ears star/halo; (5) rock golem grey brown friendly squat stone body moss tuft thick arms.
All fully inside their cells, consistent palette/outline pixel scale and baseline. Make final sprites rounded and simplified, much less elaborate than reference. Grid dimensions are essential for CSS sprite extraction; exact equally spaced 5x4 cells.

## 修正

Edit this sprite atlas into a clean PRODUCTION atlas. Preserve all twenty identities, same EXACT 5 column x 4 row row-major order. Critical: each sprite MUST be centered in its equal square cell and occupy only the inner 65% of that cell, with at least 17% fully TRANSPARENT margin on ALL four sides. No pixels may spill into an adjacent cell. Remove all stray pixels. Use uniform pixel scale. Simplify further to a much coarser low resolution friendly virtual pet look, about 32 by 32 meaningful pixels per character (upscaled pixel art), rounded two-head-tall bodies, tiny stubby feet and big readable eyes, flat limited 5 colors plus one shadow. No painterly gradients, no fine detail, no subtle antialiasing. Keep all ten final species recognizable including clearly FOUR-LEGGED turtle. Final phoenix/dragon wings must fit with generous margin. Actual transparent alpha background. No labels, no lines, no border, no shadows. Canvas aspect 5:4, perfectly regular 5x4 grid. This will be shown using exact 5x4 CSS cropping, so transparent gutter and centering are mandatory.
