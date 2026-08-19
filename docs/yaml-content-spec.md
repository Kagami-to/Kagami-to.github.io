# 共通YAMLコンテンツ仕様

鏡外公式HPのYAML駆動エリアでは、Characters / Glossaryなどのページ種別によらず、共通のYAML解析・正規化・描画仕様を使用する。

## 基本原則

YAML駆動エリアの処理は、次の一本の経路を基本とする。

`YAML → PyYAML → 共通Normalizer → JSON → 共通Renderer`

ページ種別によるYAML専用パーサー、専用レンダラー、専用表示拡張は設けない。
CSV駆動エリアの処理はページ種別ごとに独立してよい。

## 後方互換性

既存YAMLを変更しなくても、指定されていない項目には共通デフォルト値を適用する。
未指定はエラーではない。

## 言語の独立性

日本語と英語は完全に独立して描画する。

別言語へのフォールバックは行わない。

現在の表示言語に対応する `content_ja` または `content_en` が存在しない、または内容が空のセクションは、その言語ではセクション全体を表示しない。

タイトルも別言語へフォールバックしない。現在の表示言語に対応するタイトルだけを使用し、無い場合はタイトルを表示しない。

例えば `content_en` のみ存在するセクションは、英語では表示されるが、日本語ではセクションごと存在しないものとして扱う。

## 共通セクション

```yaml
id: C001

sections:
  - title_ja: 概要
    title_en: Overview
    content_ja: |
      日本語本文
    content_en: |
      English text
```

`sections` は可変長配列。

## 共通表示指定

### display

デフォルトは `normal`。

```yaml
display: normal
```

指定時のみ折りたたみ表示を有効化する。

```yaml
display: collapsible
```

### toggle_ja / toggle_en

`display: collapsible` の開閉ラベルを言語ごとに個別指定できる。

```yaml
toggle_ja:
  open: 内容を表示
  close: 内容を隠す

toggle_en:
  open: Show content
  close: Hide content
```

未指定の場合は同一言語の共通デフォルト文言を使用する。別言語のラベルは代用しない。

## 本文コンテンツ

`content_ja` / `content_en` は、文字列、またはコンテンツ要素の配列として記述できる。

文字列の場合は通常の本文として扱う。

配列では、通常のテキストブロックとエンティティIDを混在させられる。

```yaml
content_ja:
  - text: 関連作品です。
  - P001
  - P002
```

既存Glossaryデータとの互換性のため、次のブロック形式も共通仕様として受け付ける。

```yaml
content_ja:
  - align: left
    text: |
      本文
  - align: right
    text: |
      ───　人物名
```

`align` は `left` / `right` を共通で扱う。

## エンティティIDカード

`content` に相当する階層で、次の内部IDが単独要素として指定された場合、その要素を対応するエンティティカードとして描画する。

```text
P000 = Works
C000 = Characters
M000 = Songs
T000 = Glossary
```

例えば、

```yaml
content_ja:
  - P001
  - P002
```

は2件のWorksカードとして描画される。

同様に、

```yaml
content_ja:
  - C001
  - M001
  - T001
```

はCharacter / Song / Glossaryの各カードとして描画される。

IDは `^P\d+$`、`^C\d+$`、`^M\d+$`、`^T\d+$` に一致するものをカード候補とする。
対応するCSV行が存在しないIDはカードを生成しない。

通常の本文文字列、例えば `作品IDはP001です。` はカード化せず、本文として表示する。

現在表示中のページ自身のIDをカード要素として指定した場合、そのカードは生成しない。

## 本文内自動リンク

通常の本文文字列では、現在の言語に応じてCSVから取得した次の4種類の名称を自動リンク化する。

- Characters
- Glossary
- Works
- Songs

名称が重複する場合は長い名称を優先し、同一名称は一つに整理する。

本文中の `P001` などの文字列は、それだけではカードにならない。
カードになるのは `content` 配列などで独立要素として指定されたエンティティIDだけである。

## 旧 `works:` の互換性

既存Characters YAMLに存在する `works:` は後方互換性のため共通Normalizerが受け付ける。

`content_ja` と `content_en` のどちらも明示されていない `works:` 専用セクションについては、Normalizerが `P000` 型エンティティ要素の共通contentへ変換し、日本語・英語の両方で同じWorksカードとして描画できるようにする。

これは別言語へのフォールバックではなく、旧形式を新しい共通データモデルへ変換する互換処理である。

一方、`content_ja` または `content_en` のいずれかが明示されている場合、その明示された言語コンテンツを優先し、欠落言語へ内容を流用しない。

新しいYAMLではページ種別固有の `works:` を使わず、`content_ja` / `content_en` に `P000` 型IDを直接指定する方式を推奨する。

将来的には関連情報をCSV駆動エリアへ移行し、旧 `works:` 互換処理を廃止できる構造を維持する。

## 正規化

共通Normalizerは少なくとも次を処理する。

- `id` の補完
- `sections` の型確認
- タイトルの文字列化
- `display` のデフォルト補完
- `toggle_ja` / `toggle_en` のデフォルト補完
- 本文の型正規化
- コンテンツ要素内の `P/C/M/T` ID認識
- `works` 専用旧形式の共通contentへの互換変換

未知のキーは将来拡張性のため、原則として正規化結果から削除しない。

## 配置

YAMLは編集用の正本として `data/` に保存する。

ビルド時に正規化済みJSONを `_site/data/` に生成し、ブラウザはJSONのみを読む。

## レンダラー

ブラウザ側のYAML駆動表示は `assets/js/yaml-content.js` の共通レンダラーを使用する。

Characters / Glossaryで別々のYAMLレンダラーを持たない。

共通レンダラーは、セクション、タイトル、言語別コンテンツ、折りたたみ、開閉ラベル、本文内エンティティリンク、P/C/M/Tエンティティカードを同一規則で処理する。
