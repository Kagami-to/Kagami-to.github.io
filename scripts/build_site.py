from pathlib import Path
import csv, html, shutil

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
TEMPLATES = ROOT / 'templates'
SITE = ROOT / '_site'


def rows(name):
    with (DATA / name).open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def url_id(value):
    value = (value or '').strip()
    return value.lower().replace('.', '-') if value else ''


def esc(value):
    return html.escape(value or '', quote=True)


def site_header(prefix):
    return f'''<header class="site-header"><a href="{prefix}" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header>'''


def layout(title, body, depth=0, extra_head='', extra_body=''):
    prefix = '../' * depth
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css">{extra_head}</head><body>{site_header(prefix)}<main class="container">{body}</main><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-pages.js"></script>{extra_body}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def character_pager(prev_row, next_row):
    parts = []
    if prev_row:
        uid = url_id(prev_row.get('url_id'))
        name = prev_row.get('name_ja') or prev_row.get('name_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-prev" href="./{esc(uid)}.html" aria-label="前のキャラクター: {esc(name)}"><span class="character-092-pager-arrow" aria-hidden="true">〈</span></a>')
    if next_row:
        uid = url_id(next_row.get('url_id'))
        name = next_row.get('name_ja') or next_row.get('name_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-next" href="./{esc(uid)}.html" aria-label="次のキャラクター: {esc(name)}"><span class="character-092-pager-arrow" aria-hidden="true">〉</span></a>')
    return ''.join(parts)


def character_detail_layout(title, character_id, body, prev_row=None, next_row=None, depth=1):
    prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css">'
    pager = character_pager(prev_row, next_row)
    scripts = f'''<script src="{prefix}assets/js/character-pages.js"></script><script>renderCharacter({character_id!r}).catch(e=>{{const target=document.getElementById('character-page');if(target)target.textContent=e.message;}});</script>'''
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css">{head}</head><body>{site_header(prefix)}{pager}<main class="character-detail-page">{body}</main><script src="{prefix}assets/js/language.js"></script>{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def generic_detail(title_ja, title_en, row, id_col, ja_col, en_col):
    detail = f'''<div class="character-header"><h1>{esc(title_ja or title_en)}</h1><p class="character-english">{esc(title_en)}</p></div>'''
    for key, val in row.items():
        if key in {id_col, ja_col, en_col, 'url_id'} or not val:
            continue
        detail += f'<section class="character-section"><h2>{esc(key)}</h2><p>{esc(val)}</p></section>'
    return detail


def build_character_pages(data, out):
    template = (TEMPLATES / 'character-detail.html').read_text(encoding='utf-8')
    valid = [(i, r) for i, r in enumerate(data) if url_id(r.get('url_id'))]
    for pos, (_, r) in enumerate(valid):
        uid = url_id(r.get('url_id'))
        prev_row = valid[pos - 1][1] if pos > 0 else None
        next_row = valid[pos + 1][1] if pos + 1 < len(valid) else None
        html_text = character_detail_layout(r.get('name_ja','') or r.get('name_en',''), uid, template, prev_row=prev_row, next_row=next_row)
        (out / f'{uid}.html').write_text(html_text, encoding='utf-8')


def build_entity(csv_name, folder, id_col, ja_col, en_col, label):
    data = rows(csv_name)
    out = SITE / folder
    out.mkdir(parents=True, exist_ok=True)
    if folder == 'characters':
        build_character_pages(data, out)
        body = '<div class="page-heading"><h1 id="page-title">Characters</h1><div class="page-sub" id="page-sub">キャラクター</div></div><ul id="character-list" class="character-list"></ul>'
        script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'キャラクター';renderList('characters').catch(e=>console.error(e));</script>'''
    else:
        for r in data:
            uid = url_id(r.get('url_id'))
            if not uid:
                continue
            detail = generic_detail(r.get(ja_col,''), r.get(en_col,''), r, id_col, ja_col, en_col)
            (out / f'{uid}.html').write_text(layout(r.get(ja_col,'') or r.get(en_col,''), detail, 1), encoding='utf-8')
        if folder == 'works':
            body = '<div class="page-heading"><h1 id="page-title">Works</h1><div class="page-sub" id="page-sub">作品</div></div><ul id="entity-list" class="character-list"></ul>'
            script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'作品';renderList('works').catch(e=>console.error(e));</script>'''
        else:
            body = '<div class="page-heading"><h1 id="page-title">Songs</h1><div class="page-sub" id="page-sub">楽曲</div></div><ul id="entity-list" class="character-list"></ul>'
            script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'楽曲';renderList('songs').catch(e=>console.error(e));</script>'''
    (SITE / folder / 'index.html').write_text(layout(label, body, 1, extra_body=script), encoding='utf-8')


def prepare_site():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    for directory in ('assets', 'images'):
        source = ROOT / directory
        if source.exists():
            shutil.copytree(source, SITE / directory, dirs_exist_ok=True)
    preview_source = ROOT / 'preview'
    if preview_source.exists():
        shutil.copytree(preview_source, SITE / 'preview', dirs_exist_ok=True)
    data_out = SITE / 'data'
    data_out.mkdir(parents=True, exist_ok=True)
    for name in ('characters.csv', 'songs.csv', 'works.csv'):
        source = DATA / name
        if source.exists():
            shutil.copy2(source, data_out / name)
    for name in ('index.html', 'robots.txt', 'sitemap.xml', 'favicon.ico', '1000019929.svg'):
        source = ROOT / name
        if source.exists():
            shutil.copy2(source, SITE / name)
