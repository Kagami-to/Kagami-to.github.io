from pathlib import Path
import csv, html, re

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'kagamito' / 'pages'


def rows(name):
    with (DATA / name).open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def slug(value):
    return re.sub(r'[^a-z0-9_-]', '-', (value or '').strip().lower().replace('.', '-'))


def esc(value):
    return html.escape(value or '', quote=True)


def layout(title, body, depth=0):
    prefix = '../' * depth
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"></head><body><header class="site-header"><a href="{prefix}" class="site-title">鏡外 - Kagamito Official Site</a><nav></nav></header><main class="container">{body}</main><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-pages.js"></script><script src="{prefix}assets/js/menu.js"></script></body></html>'''


def build_entity(csv_name, folder, id_col, ja_col, en_col, label):
    data = rows(csv_name)
    out = ROOT / folder
    out.mkdir(parents=True, exist_ok=True)
    items=[]
    for r in data:
        uid = slug(r.get('url_id') or r.get(id_col))
        if not uid: continue
        ja=r.get(ja_col,''); en=r.get(en_col,'')
        items.append((uid, ja, en, r))
        detail=f'''<div class="character-header"><h1>{esc(ja or en)}</h1><p class="character-english">{esc(en)}</p></div>'''
        for key,val in r.items():
            if key in {id_col,ja_col,en_col,'url_id'} or not val: continue
            detail += f'<section class="character-section"><h2>{esc(key)}</h2><p>{esc(val)}</p></section>'
        (out / f'{uid}.html').write_text(layout(ja or en, detail, 1), encoding='utf-8')
    listing=f'<h1>{esc(label)}</h1><ul class="character-list">'
    for uid,ja,en,_ in items:
        listing += f'<li><a href="{uid}.html"><span class="list-main">{esc(ja or en)}</span><span class="list-japanese">{esc(en)}</span></a></li>'
    listing += '</ul>'
    (out/'index.html').write_text(layout(label, listing, 1), encoding='utf-8')


def main():
    build_entity('characters.csv','characters','character_id','name_ja','name_en','Characters')
    build_entity('works.csv','works','work_id','title_ja','title_en','Works')
    build_entity('songs.csv','songs','song_id','title_ja','title_en','Songs')

if __name__ == '__main__': main()
