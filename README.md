# Kagamito Official Site

「鏡外」公式ホームページのソースリポジトリです。GitHub Pages で公開しています。

## 構成

- `data/` — サイトの原データ。CSVを基本データ、Character / Glossary の詳細データをYAMLで管理します。
- `templates/` — 各ページのHTML骨格。データそのものや一覧ロジックは持たせません。
- `scripts/` — 本番サイトのビルド処理。
  - `build.py` — 本番ビルドの単一入口。
  - `build_entities.py` — Characters / Works / Songs のページ生成。
  - `build_glossary.py` — Glossary の一覧・詳細ページ生成。
  - `build_data.py` — CSV読み込み等の共通データ処理。
  - `build_html.py` — 共通HTMLレイアウト。
- `assets/css/` — CSS。
- `assets/js/` — ブラウザ側の共通処理、一覧・詳細ページ処理、メニュー、言語切替など。
- `_site/` — ビルド生成物。手作業で編集しません。

## データの考え方

CSVは一覧表示・相互参照の基礎データとして使用します。ページ固有の詳細情報は、対応するYAMLデータがある場合にそこから読み込みます。

`url_id` は公開ページのURL生成に使われるため、既存値を不用意に変更しないでください。

## ビルド

リポジトリのルートではなく `scripts/` をカレントディレクトリとして直接実行することもできます。

```bash
cd scripts
python build.py
```

生成先は `_site/` です。

GitHub Actions ではこのビルドを実行し、生成した `_site/` を GitHub Pages にデプロイします。

## ページ実装の責務

HTMLの骨格は `templates/`、データ取得・変換は `scripts/` / `assets/js/*-data.js`、ブラウザ上の描画とUI制御は `assets/js/`、見た目は `assets/css/` が担当します。

同じ処理が複数ページに存在していても、共通化によってページ間の依存関係が複雑になる場合は、無理に一つへ統合しません。特にGlossaryやメニューのような専用UIは、独立した責務として残すことがあります。

## 開発時の注意

- 生成結果を維持することを最優先とします。リファクタリングでは、見た目・URL・表示順・言語切替などの既存挙動を変更しません。
- `menu.js` はサイト全体のUIに影響するため、読み込み順を変更する場合は通常ページ・Glossary・トップページ・404ページを確認します。
- `url_id` や既存のページファイル名を変更すると外部リンクが壊れる可能性があります。
- Glossary一覧とメニューでは、それぞれのページ固有の依存関係を維持してください。共通化は依存関係が単純になる場合に限ります。

## 公開

`main` ブランチへの変更は GitHub Actions の `Build and Deploy GitHub Pages` ワークフローでビルド・デプロイされます。
