# 共通YAMLコンテンツ仕様

鏡外公式HPのYAML駆動エリアでは、Characters / Glossaryなどのページ種別によらず、共通のYAML解析・正規化・描画仕様を使用する。

## 基本原則

YAML駆動エリアの処理は、次の一本の経路を基本とする。

`YAML → PyYAML → 共通Normalizer → JSON → 共通Renderer`

ページ種別によるYAML専用レンダラー、専用パーサー、専用表示拡張は設けない。

CSV駆動エリアの処理はページ種別ごとに独立してよい。

## 後方互換性

既存YAMLを変更しなくても、指定されていない項目には共通デフォルト値を適用し、従来の通常表示を維持する。

未指定はエラーではない。

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

または、指定時のみ折りたたみ表示を有効化する。

```yaml
display: collapsible
```

### toggle_ja / toggle_en

`display: collapsible` の開閉ラベルを個別指定できる。

```yaml
toggle_ja:
  open: 内容を表示
  close: 内容を隠す

toggle_en:
  open: Show content
  close: Hide content
```

未指定の場合は共通デフォルト文言を使用する。

## 本文

`content_ja` / `content_en` は文字列を基本とする。

旧Glossaryデータとの互換性のため、次のようなブロック配列も共通仕様として受け付ける。

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

## 本文内リンク

YAML本文では、現在の言語に応じて次の4種類のCSVデータを使用した自動リンクを共通で提供する。

- Characters
- Glossary
- Works
- Songs

名称が重複する場合は長い名称を優先し、同一名称は一つに正規化する。

## 関連作品の互換性

既存Characters YAMLに存在する `works:` は後方互換性のため共通Normalizerが受け付ける。

内部的には `related_works` として正規化する。

これはCharacters専用仕様ではなく、共通YAML上で後方互換入力として扱う。

将来的には関連情報をCSV駆動エリアへ移行し、YAML側の関連指定を削除する予定。

## 正規化

共通Normalizerは、少なくとも次を処理する。

- `id` の補完
- `sections` の型確認
- タイトルの文字列化
- `display` のデフォルト補完
- `toggle_ja` / `toggle_en` のデフォルト補完
- 本文の型正規化
- `works` → `related_works` の互換変換

未知のキーは将来拡張性のため正規化結果から原則として削除しない。

## 配置

YAMLは編集用の正本として `data/` に保存する。

ビルド時に正規化済みJSONを `_site/data/` に生成し、ブラウザはJSONのみを読む。

## レンダラー

ブラウザ側のYAML駆動表示は `assets/js/yaml-content.js` の共通レンダラーを使用する。

Characters / Glossaryで別々のYAMLレンダラーを持たない。

共通レンダラーは、セクション、タイトル、本文、折りたたみ、開閉ラベル、本文内エンティティリンク、互換関連作品を同一規則で処理する。
