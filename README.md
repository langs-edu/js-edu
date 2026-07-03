# JavaScript縁日 — さわって、動かして、おぼえる。

**https://langs-edu.github.io/js-edu/**

登録不要・広告なし・ずっと無料の、JavaScriptプログラミング学習サイト。
モダンJavaScript（let/const・テンプレートリテラル・アロー関数・class）を前提に、インストールなしで、いま開いているこのページの中でコードを動かしながら学びます。

## 特徴

- **インストール不要。全レッスンに、その場で書き換えて実行できる遊び場があります。** ブラウザ内実行のプレイグラウンド「CodeRunner」（JavaScript）と「HtmlRunner」（HTML+JS）を埋め込み、読むだけでなく押して確かめられます
- **あとで壊れないたとえ** — 「変数は箱」のような、あとで壊れるたとえを使わない。エラーは失敗ではなく誠実な読み手の返事として読み方を教える一方、JavaScriptが「止まって教えてくれるとは限らない読み手」であることも隠さない
- **モダンJavaScriptが前提** — let/const・テンプレートリテラル・アロー関数・classを最初から自然な書き方として使う。古い書き方（var・==など）は「読めるとよい知識」として区別してあつかう
- **サンプルコードとプレイグラウンドの初期コードはCIで検証済み** — レッスン・コラム中のJavaScriptコードと、CodeRunnerの初期コードは、CIで`Node.js 22`により実行検証している。ブラウザ専用（DOM）の例と意図的なエラー例（`expectError` / `nocheck`指定）は検証対象外とし、実物の動作を確認した上で掲載している
- **順序制約を守った設計** — 未習の構文を先に使わない。アロー関数・コールバック・map/filterはコース4まで、DOM APIはコース5まで登場しない、といった学習順序を厳密に守る
- **コラム「屋台のこぼれ話」** — 10日間で作られた言語、Javaとは名前だけの他人、0.1 + 0.2の夜店の手品——本文の外にある寄り道の読みもの

## コース（全6コース・42レッスン）

| コース | 内容 | レッスン数 | 前提 |
|---|---|---|---|
| 1. はじめてのJavaScript | CodeRunnerでの最初の一歩から、変数・型・文字列・数・エラーの読み方、Node.jsまで | 8 | なし |
| 2. プログラムの流れ | if/while/for、関数、スコープ、数当てゲーム | 7 | コース1 |
| 3. データをまとめる | 配列、オブジェクト、分割代入・スプレッド、null/undefined、単語カウンタ | 7 | コース2 |
| 4. 関数とオブジェクトのかたち | アロー関数、コールバック、map/filter/find、class、JSON、例外、ミニ図書館 | 8 | コース3 |
| 5. ブラウザとDOM | document・querySelector・イベント。HtmlRunnerでHTML+JSを一緒に動かす | 6 | コース4 |
| 6. 小さな道具をつくる | 読書メモWebアプリ「hondana」を設計からnode:testでのテスト・仕上げまで作る | 6 | コース4・コース5 |

各レッスンは、それ以前のレッスンで学んだことだけを使って書かれています。未習の機能をどうしても先に使う場合は、「いまは呪文のままでかまいません」と正直に保留を宣言します。

## 技術

- [Astro 6](https://astro.build/) + MDX + [astro-expressive-code](https://expressive-code.com/) + Preact islands + nanostores
- **CodeRunner / HtmlRunner** — Web Workerサンドボックス（`src/engine/runner/`）でJavaScriptをブラウザ内実行。無限ループはホスト側でWorkerをterminateして止め、実行時エラーには日本語の読み解きを併記する。エディタは CodeMirror 6
- JavaScript検証ハーネス（`scripts/check-js.mjs`、依存パッケージなし）: レッスン・コラム中の`js`フェンスと、CodeRunnerの`initialCode`を実際にNode.jsで実行して検証
- Vitest（検証ハーネスの純関数部分・サンドボックスのエラー翻訳/出力整形部分 coverage 80%+）
- GitHub Actions → GitHub Pages

## 開発

```bash
pnpm install
pnpm dev             # 開発サーバ
pnpm check           # astro check（型チェック）
pnpm test:unit       # 検証ハーネス・実行エンジンの純関数ユニットテスト
pnpm check:js        # レッスン・コラム中のJavaScriptコードを実際に検証（Node.js 22）
pnpm build           # 本番ビルド
```

レッスンは `src/content/lessons/{hajimete,nagare,matomeru,sekkei,dom,koubou}/` のMDX。コラムは `src/content/yatai/` のMDX。コードフェンス・CodeRunner/HtmlRunnerのMDX契約は執筆スタイルガイドを参照してください。

## ライセンス

- **コード**: [MIT License](./LICENSE) — サイト実装に加え、**レッスン内のサンプルコード**も含みます。学習・改変・再利用は自由です
- **教材テキスト**: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ja) — レッスンやコラムの文章・説明文が対象です

姉妹サイトに、CS・プログラミング言語教育サイト「[言語の庭](https://kmizu.github.io/cs-edu-site/)」、Java学習サイト「[喫茶Java](https://langs-edu.github.io/java-edu/)」、Python学習サイト「[Pythonの湯](https://langs-edu.github.io/python-edu/)」があります。
