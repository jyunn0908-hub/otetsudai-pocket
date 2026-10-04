# おてつだいポケット

親と子供がAndroidのホーム画面から使える、お手伝い・ポイント・ご褒美交換のPWAです。画面は日本語、9歳の子供を想定しています。

## 機能

- 親がお手伝いと獲得ポイント、ご褒美と必要ポイントを登録・編集・削除
- 子供が完了報告、親の承認でポイント加算
- 子供がご褒美の交換を申請、親の承認でポイント減算
- 家族への参加は親の承認制
- ポイントの履歴、子供の端末変更時の引き継ぎ
- 親1アカウント、子供1人用

## ローカルで動かす

Node.jsとPython 3が必要です。画面の表示にnpmパッケージのインストールは不要です。

```sh
cp dist/config.example.js dist/config.js
npm test
npm run preview
```

`http://127.0.0.1:4173/` を開きます。設定が `null` の場合は、明示されたおためしモードになります。サンプルの70ポイントで親・子供の操作を試せます。おためしモードのデータはメモリ上だけにあり、再読み込みで消えます。

## 本番で使う

1. Firebaseプロジェクトを作成し、Webアプリを登録
2. `dist/config.js` の `null` を自分の `firebaseConfig` オブジェクトに置換
3. Authenticationで「メール／パスワード」と「匿名」を有効化。匿名アカウントの自動削除は無効のままにする
4. Firestore Standardの `(default)` データベースを本番モードで作成
5. 公式CLIでログインし公開

```sh
npx --yes firebase-tools login
npm run deploy
```

`deploy` は設定内の `projectId` を対象にHostingとFirestoreルールを反映します。対象プロジェクトの既存ルールを置き換えるため、専用プロジェクトを使ってください。

初期設定後、親がアプリで登録し、「家族の設定」の招待リンクを子供の端末で開きます。子供の参加申請を親が承認してください。Chromeの「ホーム画面に追加」でPWAとして使えます。

## ChatGPTやCodexに相談する

最初に [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) を読ませ、変更したいことを伝えます。

例：

> このリポジトリのPROJECT_CONTEXT.mdとAGENTS.mdを読んでください。子供のお手伝い管理アプリです。既存の承認制とポイントの整合性を保ちながら、「曜日ごとのお手伝い」を追加したいです。必要な変更を説明して実装してください。

コードの相談には、この一式をZIPで添付する方法もあります。GitHub連携を使う場合は、対象リポジトリを閲覧できるように設定してください。コードを変更しただけでは公開アプリは更新されません。変更確認後にFirebaseへ再公開します。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `dist/app.js` | UI、Firebase Auth、Firestore購読、申請・承認処理 |
| `dist/domain.mjs` | 初期データ、ポイント計算、承認時の整合性チェック |
| `dist/style.css` | スマホ・PC向け表示 |
| `dist/config.example.js` | 接続設定の見本（`config.js`はGit管理しません） |
| `dist/sw.js`、`dist/manifest.webmanifest` | PWA設定と画面ファイルのキャッシュ |
| `firestore.rules` | 家族と役割ごとのアクセス権 |
| `tests/domain.test.mjs` | ポイント計算の7テスト |
| `tests/rules.test.mjs` | Firebase公式エミュレーター用テスト |

## 現在の制約

- 日本時間でお手伝い1つにつき1日1回
- プッシュ通知なし。開いている間は申請と残高を同期
- オフラインでの記録・承認・交換は非対応
- ご褒美申請はポイントを予約しない。承認時に残高を確認
- 項目のポイント変更は、確認待ち申請の承認額にも適用される
- 家族の状態と履歴を1つのFirestoreドキュメントに保持。履歴が増え続けるため、長期利用の拡張では履歴を別コレクションに分離する

## アクセス制御と検証

子供はポイント残高や承認結果を直接変更できません。権限はUIだけでなくFirestoreルールで制御しています。承認と残高更新はFirestoreトランザクションで行います。

`npm test` でポイント計算を確認できます。ルールテストにはJava 21以上と追加のテストパッケージが必要です。

```sh
npm install --no-save firebase @firebase/rules-unit-testing firebase-tools
npx firebase emulators:exec --project demo-otetsudai --only firestore "node tests/rules.test.mjs"
```

初版は本番Firebaseでも、一時的なテスト用アカウントで参加・承認・加算・交換・アクセス制御を検証しました。テスト用アカウントとデータは削除済みです。

このリポジトリに家族の実データ、パスワード、CLIの認証情報、サービスアカウント鍵を含めないでください。

## 育成機能（開発版）

「そだてる」でタマゴから約21日を目安に成長します。親の承認1回で成長10pt。Day 7/13/21と累計80/150/230ptを両方満たすとランダムに進化します。図鑑は育成ごとの履歴を保存します。

初版の未確定事項の扱い、仮の進化ツリー、親のアプリでの日数再判定と検証結果は [実装メモ](docs/GROWTH_IMPLEMENTATION.md) を参照してください。
