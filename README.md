# 解像堂（Kaizō-dō）— 実装解像度 / WCM編

コンサルタントのための、Webコンテンツ管理（WCM）の「実装解像度」を上げる無料の学習サイト。
これは縦串1本（トップ＋Stage 1）の完成版です。

## 入っているもの
- `index.html` … トップページ（二部構成の全体像・ピントダイヤル・ステージ地図）
- `stage-1.html` … 第一部 Stage 1「Webの体」（中身×見た目の分離を体感するラボ）
- `define.html` … 第二部「合意の解像度」（理解・定義・合意の方法論。要望→ジョブ、ジャーニーの効きどころ、ユーザーストーリーと受け入れ条件、そして実装への接続）

依存パッケージ・ビルド作業は一切なし。3つのHTMLをそのまま置けば動きます。
フォントはGoogle Fontsから自動で読み込まれます（ネット接続のある環境で最適表示）。

---

## 公開手順 ── コマンドライン不要

GitHubの画面操作だけで公開できます。ターミナルは使いません。

1. **GitHubアカウントを作る**（無料）: https://github.com/signup
2. 右上の「＋」→ **New repository** で新しいリポジトリを作成。
   - Repository name は例えば `kaizoudo`。
   - **Public** を選ぶ（Pagesの無料公開はPublicが前提）。
   - 「Create repository」。
3. 作成直後の画面で **uploading an existing file** のリンクをクリック。
   - `index.html`・`stage-1.html`・`define.html` を**ドラッグ＆ドロップ**でアップロード。
   - 下の「Commit changes」を押す。
4. 上部メニュー **Settings → Pages** を開く。
   - 「Build and deployment」の Source を **Deploy from a branch** に。
   - Branch を **main** ／ フォルダを **/(root)** にして **Save**。
5. 1〜2分待つと、同じPages画面に公開URL（`https://ユーザー名.github.io/kaizoudo/`）が出ます。完成。

> トップを開くと `index.html`、`Stage 1 をはじめる` から `stage-1.html` に進みます。

---

## このあとの拡張について
- 縦串の手応えを確認できたら、Stage 2以降（コンテンツモデリング → API配信 → 公開 → 運用 → 還元 → 失敗の博物館）へ横展開します。
- ステージが増えてきたら、各ページ共通のCSS/JSを外部ファイルに切り出す、もしくはAstro等へ移行すると保守が楽になります（現状は1ページ完結で最速・最軽量を優先）。

無料・非技術者にも入りやすく、それでいて陳腐でないこと。これが設計の芯です。
