from pathlib import Path
import shutil

from build_data import DATA, rows, url_id
from build_html import VIEWPORT, entity_detail_layout, esc, layout, site_header

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / 'templates'
SITE = ROOT / '_site'


def entity_pager(prev_row, next_row, label_column, label_prefix):
    parts = []
    for row, side, direction, aria_prefix in (
        (prev_row, 'prev', '〈', f'前の{label_prefix}'),
        (next_row, 'next', '〉', f'次の{label_prefix}'),
    ):
        if not row:
            continue
        uid = url_id(row.get('url_id'))
        label = row.get(label_column) or row.get('name_ja') or row.get('name_en') or row.get('title_ja') or row.get('title_en') or uid
        parts.append(
            f'<a class="detail-pager detail-pager-{side}" href="./{esc(uid)}.html" '
            f'aria-label="{aria_prefix}: {esc(label)}"><span class="detail-pager-arrow" '
            f'aria-hidden="true">{direction}</span></a>'
        )
    return ''.join(parts)


def character_detail_layout(title, character_id, body, prev_row=None, next_row=None, depth=1):
    prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css">'
    pager = entity_pager(prev_row, next_row, 'name_ja', 'キャラクター')
    scripts = f'''<script src="{prefix}assets/js/character-pages.js"></script><script>renderCharacter({character_id!r}).catch(e=>{{const target=document.getElementById('character-page');if(target)target.textContent=e.message;}});</script>'''
    return entity_detail_layout(
        title,
        body,
        pager,
        head,
        scripts,
        depth=depth,
        main_open='<main class="character-detail-page">',
        main_close='</main>',
    )


def song_pager_html(row, prev_row=None, next_row=None, depth=1):
    template = (TEMPLATES / 'song-detail.html').read_text(encoding='utf-8')
    body = template.replace('{{SONG_ID}}', esc(row.get('song_id')))
    pager = entity_pager(prev_row, next_row, 'title_ja', '楽曲')
    prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css"><link rel="stylesheet" href="{prefix}assets/css/song-detail.css">'
    scripts = f'''<script src="{prefix}assets/js/song-pages.js"></script><script>document.documentElement.lang=getLanguage();renderSong({esc(row.get('song_id'))!r}).catch(e=>{{const target=document.getElementById('song-page');if(target)target.textContent=e.message;}});</script>'''
    return entity_detail_layout(row.get('title_ja') or row.get('title_en'), body, pager, head, scripts, depth=depth)


def work_detail_layout(row, prev_row=None, next_row=None, depth=1):
    template = (TEMPLATES / 'work-detail.html').read_text(encoding='utf-8')
    body = template
    pager = entity_pager(prev_row, next_row, 'title_ja', '作品')
    prefix = '../' * depth
    head = f'<link rel="stylesheet" href="{prefix}assets/css/character-detail.css"><link rel="stylesheet" href="{prefix}assets/css/work-detail.css">'
    scripts = f'''<script src="{prefix}assets/js/work-pages.js"></script><script>document.documentElement.lang=getLanguage();renderWork({esc(row.get('work_id'))!r}).catch(e=>{{const target=document.getElementById('work-page');if(target)target.textContent=e.message;}});</script>'''
    return entity_detail_layout(row.get('title_ja') or row.get('title_en'), body, pager, head, scripts, depth=depth)


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


ENTITY_BUILD_CONFIG = {
    'characters': {
        'build_pages': build_character_pages,
        'label': 'Characters',
        'heading_sub': 'キャラクター',
        'list_markup': '<ul id="character-list" class="character-list"></ul>',
        'list_css': 'entity-pages.css',
        'render_script': """<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'キャラクター';renderList('characters').catch(e=>console.error(e));</script>""",
    },
    'works': {
        'build_pages': build_work_pages,
        'label': 'Works',
        'heading_sub': '作品',
        'list_markup': '<ul id="entity-list" class="character-list"></ul>',
        'list_css': 'entity-pages.css',
        'render_script': """<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'作品';renderList('works').catch(e=>console.error(e));</script>""",
    },
    'songs': {
        'build_pages': build_song_pages,
        'label': 'Songs',
        'heading_sub': '楽曲',
        'list_markup': '<ul id="entity-list" class="character-list"></ul>',
        'list_css': 'entity-pages.css',
        'render_script': """<script>document.documentElement.lang=getLanguage();document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'楽曲';renderList('songs').catch(e=>console.error(e));</script>""",
    },
}


def build_entity(csv_name, folder):
    config = ENTITY_BUILD_CONFIG[folder]
    data = rows(csv_name)
    out = SITE / folder
    out.mkdir(parents=True, exist_ok=True)
    config['build_pages'](data, out)
    body = (
        f'<div class="page-heading"><h1 id="page-title">{config["label"]}</h1>'
        f'<div class="page-sub" id="page-sub">{config["heading_sub"]}</div></div>'
        f'{config["list_markup"]}'
    )
    extra_head = f'<link rel="stylesheet" href="../assets/css/{config["list_css"]}">' if config.get('list_css') else ''
    (out / 'index.html').write_text(
        layout(config['label'], body, 1, extra_head=extra_head, extra_body=config['render_script']),
        encoding='utf-8',
    )


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


def main():
    prepare_site(); build_entity('characters.csv', 'characters'); build_entity('works.csv', 'works'); build_entity('songs.csv', 'songs')

if __name__ == '__main__': main()
