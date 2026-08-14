from pathlib import Path
import csv, html, shutil

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
TEMPLATES = ROOT / 'templates'
SITE = ROOT / '_site'
PREVIEW = ROOT / 'preview'


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
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{extra_head}</head><body>{site_header(prefix)}<main class="container">{body}</main><script src="{prefix}assets/js/data.js"></script><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-common.js"></script><script src="{prefix}assets/js/entity-pages.js"></script>{extra_body}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def character_pager(prev_row, next_row):
    parts = []
    if prev_row:
        uid = url_id(prev_row.get('url_id')); name = prev_row.get('name_ja') or prev_row.get('name_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-prev" href="./{esc(uid)}.html" aria-label="前のキャラクター: {esc(name)}"><span class="character-092-pager-arrow" aria-hidden="true">〈</span></a>')
    if next_row:
        uid = url_id(next_row.get('url_id')); name = next_row.get('name_ja') or next_row.get('name_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-next" href="./{esc(uid)}.html" aria-label="次のキャラクター: {esc(name)}"><span class="character-092-pager-arrow" aria-hidden="true">〉</span></a>')
    return ''.join(parts)


def song_pager(prev_row, next_row):
    parts = []
    if prev_row:
        uid = url_id(prev_row.get('url_id')); label = prev_row.get('title_ja') or prev_row.get('title_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-prev" href="./{esc(uid)}.html" aria-label="前の楽曲: {esc(label)}"><span class="character-092-pager-arrow" aria-hidden="true">〈</span></a>')
    if next_row:
        uid = url_id(next_row.get('url_id')); label = next_row.get('title_ja') or next_row.get('title_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-next" href="./{esc(uid)}.html" aria-label="次の楽曲: {esc(label)}"><span class="character-092-pager-arrow" aria-hidden="true">〉</span></a>')
    return ''.join(parts)


def work_pager(prev_row, next_row):
    parts = []
    if prev_row:
        uid = url_id(prev_row.get('url_id')); label = prev_row.get('title_ja') or prev_row.get('title_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-prev" href="./{esc(uid)}.html" aria-label="前の作品: {esc(label)}"><span class="character-092-pager-arrow" aria-hidden="true">〈</span></a>')
    if next_row:
        uid = url_id(next_row.get('url_id')); label = next_row.get('title_ja') or next_row.get('title_en') or uid
        parts.append(f'<a class="character-092-pager character-092-pager-next" href="./{esc(uid)}.html" aria-label="次の作品: {esc(label)}"><span class="character-092-pager-arrow" aria-hidden="true">〉</span></a>')
    return ''.join(parts)


def character_detail_layout(title, character_id, body, prev_row=None, next_row=None, depth=1):
    prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css">'
    pager = character_pager(prev_row, next_row)
    scripts = f'''<script src="{prefix}assets/js/character-pages.js"></script><script>renderCharacter({character_id!r}).catch(e=>{{const target=document.getElementById('character-page');if(target)target.textContent=e.message;}});</script>'''
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{head}</head><body>{site_header(prefix)}{pager}<main class="character-detail-page">{body}</main><script src="{prefix}assets/js/data.js"></script><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-common.js"></script>{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def song_pager_html(row, prev_row=None, next_row=None, depth=1):
    template = (TEMPLATES / 'song-detail.html').read_text(encoding='utf-8')
    body = template.replace('{{SONG_ID}}', esc(row.get('song_id')))
    pager = song_pager(prev_row, next_row); prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css"><link rel="stylesheet" href="{prefix}assets/css/song-detail.css">'
    scripts = f'''<script src="{prefix}assets/js/song-pages.js"></script><script>document.documentElement.lang=getLanguage();renderSong({esc(row.get('song_id'))!r}).catch(e=>{{const target=document.getElementById('song-page');if(target)target.textContent=e.message;}});</script>'''
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(row.get('title_ja') or row.get('title_en'))} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{head}</head><body>{site_header(prefix)}{pager}{body}<script src="{prefix}assets/js/data.js"></script><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-common.js"></script>{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def work_detail_layout(row, prev_row=None, next_row=None, depth=1):
    template = (TEMPLATES / 'work-detail.html').read_text(encoding='utf-8'); pager = work_pager(prev_row, next_row); prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css"><link rel="stylesheet" href="{prefix}assets/css/work-detail.css">'
    scripts = f'''<script src="{prefix}assets/js/work-pages.js"></script><script>document.documentElement.lang=getLanguage();renderWork({esc(row.get('work_id'))!r}).catch(e=>{{const target=document.getElementById('work-page');if(target)target.textContent=e.message;}});</script>'''
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(row.get('title_ja') or row.get('title_en'))} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{head}</head><body>{site_header(prefix)}{pager}{template}<script src="{prefix}assets/js/data.js"></script><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-common.js"></script>{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def build_character_pages(data, out):
    template = (TEMPLATES / 'character-detail.html').read_text(encoding='utf-8')
    valid = [(i, r) for i, r in enumerate(data) if url_id(r.get('url_id'))]
    for pos, (_, r) in enumerate(valid):
        uid = url_id(r.get('url_id')); prev_row = valid[pos - 1][1] if pos > 0 else None; next_row = valid[pos + 1][1] if pos + 1 < len(valid) else None
        html_text = character_detail_layout(r.get('name_ja','') or r.get('name_en',''), uid, template, prev_row=prev_row, next_row=next_row)
        (out / f'{uid}.html').write_text(html_text, encoding='utf-8')


def build_song_pages(data, out):
    valid = [(i, r) for i, r in enumerate(data) if url_id(r.get('url_id')) and (r.get('title_ja') or '').strip()]
    for r in data:
        uid = url_id(r.get('url_id'))
        if not uid: continue
        pos = next((p for p, (_, v) in enumerate(valid) if v is r), None)
        prev_row = valid[pos - 1][1] if pos is not None and pos > 0 else None; next_row = valid[pos + 1][1] if pos is not None and pos + 1 < len(valid) else None
        (out / f'{uid}.html').write_text(song_pager_html(r, prev_row=prev_row, next_row=next_row), encoding='utf-8')


def build_work_pages(data, out):
    valid = [(i, r) for i, r in enumerate(data) if url_id(r.get('url_id')) and (r.get('title_ja') or '').strip()]
    for pos, (_, r) in enumerate(valid):
        uid = url_id(r.get('url_id')); prev_row = valid[pos - 1][1] if pos > 0 else None; next_row = valid[pos + 1][1] if pos + 1 < len(valid) else None
        (out / f'{uid}.html').write_text(work_detail_layout(r, prev_row=prev_row, next_row=next_row), encoding='utf-8')


def build_entity(csv_name, folder, id_col, ja_col, en_col, label):
    data = rows(csv_name); out = SITE / folder; out.mkdir(parents=True, exist_ok=True)
    if folder == 'characters':
        build_character_pages(data, out); body = '<div class="page-heading"><h1 id="page-title">Characters</h1><div class="page-sub" id="page-sub">キャラクター</div></div><ul id="character-list" class="character-list"></ul>'; script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'キャラクター';renderList('characters').catch(e=>console.error(e));</script>'''
    elif folder == 'songs':
        build_song_pages(data, out); body = '<div class="page-heading"><h1 id="page-title">Songs</h1><div class="page-sub" id="page-sub">楽曲</div></div><ul id="entity-list" class="character-list"></ul>'; script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'楽曲';renderList('songs').catch(e=>console.error(e));</script>'''
    else:
        build_work_pages(data, out); body = '<div class="page-heading"><h1 id="page-title">Works</h1><div class="page-sub" id="page-sub">作品</div></div><ul id="entity-list" class="character-list"></ul>'; script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'作品';renderList('works').catch(e=>console.error(e));</script>'''
    (SITE / folder / 'index.html').write_text(layout(label, body, 1, extra_body=script), encoding='utf-8')


def prepare_site():
    if SITE.exists(): shutil.rmtree(SITE)
    SITE.mkdir(parents=True); source = ROOT / 'assets'
    if source.exists(): shutil.copytree(source, SITE / 'assets', dirs_exist_ok=True)
    data_out = SITE / 'data'; data_out.mkdir(parents=True, exist_ok=True)
    for name in ('characters.csv', 'songs.csv', 'works.csv'):
        source = DATA / name
        if source.exists(): shutil.copy2(source, data_out / name)
    character_yaml = DATA / 'characters'
    if character_yaml.exists(): shutil.copytree(character_yaml, data_out / 'characters', dirs_exist_ok=True)
    pages_out = SITE / 'pages'; pages_out.mkdir(parents=True, exist_ok=True)
    site_text = ROOT / 'pages' / 'site_text.csv'
    if site_text.exists(): shutil.copy2(site_text, pages_out / 'site_text.csv')
    for name in ('index.html', 'robots.txt', 'sitemap.xml', 'favicon.ico', '1000019929.svg'):
        source = ROOT / name
        if source.exists(): shutil.copy2(source, SITE / name)


def publish_previews():
    if not PREVIEW.exists(): return
    shutil.copytree(PREVIEW, SITE / 'preview', dirs_exist_ok=True)


def main():
    prepare_site(); build_entity('characters.csv', 'characters', 'character_id', 'name_ja', 'name_en', 'Characters'); build_entity('works.csv', 'works', 'work_id', 'title_ja', 'title_en', 'Works'); build_entity('songs.csv', 'songs', 'song_id', 'title_ja', 'title_en', 'Songs'); publish_previews()

if __name__ == '__main__': main()
