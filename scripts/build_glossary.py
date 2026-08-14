from pathlib import Path
import csv, html, shutil

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
SITE = ROOT / '_site'
TEMPLATE = ROOT / 'templates' / 'glossary-list.html'

CATEGORIES = {
    'place': ('地名・施設・場所', 'Places'),
    'organization': ('組織', 'Organizations'),
    'item': ('道具・物品', 'Items'),
    'concept': ('概念', 'Concepts'),
    'other': ('その他', 'Other'),
}

def esc(v):
    return html.escape(v or '', quote=True)

def layout(body):
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glossary - Kagamito Official</title><link rel="stylesheet" href="../assets/css/style.css"><link rel="stylesheet" href="../assets/css/entity-cards.css"><link rel="stylesheet" href="../assets/css/glossary-list.css"></head><body><header class="site-header"><a href="../" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header><main class="container">{body}</main><script src="../assets/js/data.js"></script><script src="../assets/js/language.js"></script><script src="../assets/js/entity-common.js"></script><script src="../assets/js/glossary-pages.js"></script><script>document.documentElement.lang=getLanguage();initGlossaryList().catch(e=>console.error(e));</script><script src="../assets/js/menu.js"></script></body></html>'''

def main():
    src = DATA / 'glossary.csv'
    if not src.exists(): return
    out = SITE / 'glossary'; out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, SITE / 'data' / 'glossary.csv')
    body = TEMPLATE.read_text(encoding='utf-8')
    (out / 'index.html').write_text(layout(body), encoding='utf-8')

if __name__ == '__main__': main()
