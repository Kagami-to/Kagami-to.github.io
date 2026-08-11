from pathlib import Path
import csv, html

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'


def rows(name):
    with (DATA / name).open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def url_id(value):
    value = (value or '').strip()
    return value.lower().replace('.', '-') if value else ''


def esc(value):
    return html.escape(value or '', quote=True)


def layout(title, body, depth=0, extra_head=''):
    prefix = '../' * depth
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/production-v2.css">{extra_head}</head><body><header class="site-header"><a href="{prefix}" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header><main class="container">{body}</main><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-pages.js"></script><script src="{prefix}assets/js/menu.js"></script></body></html>'''


def remove_stale_pages(out, valid_ids):
    for path in out.glob('*.html'):
        if path.name != 'index.html' and path.stem not in valid_ids:
            path.unlink()
            print(f'Removed stale page: {path.relative_to(ROOT)}')


def detail_page(title_ja, title_en, rows_data, id_col, ja_col, en_col, uid, folder):
    detail = f'''<div class="character-header"><h1>{esc(title_ja or title_en)}</h1><p class="character-english">{esc(title_en)}</p></div>'''
    row = next((r for r in rows_data if url_id(r.get('url_id')) == uid), {})
    for key, val in row.items():
        if key in {id_col, ja_col, en_col, 'url_id'} or not val:
            continue
        detail += f'<section class="character-section"><h2>{esc(key)}</h2><p>{esc(val)}</p></section>'
    return detail


def build_entity(csv_name, folder, id_col, ja_col, en_col, label):
    data = rows(csv_name)
    out = ROOT / folder
    out.mkdir(parents=True, exist_ok=True)
    valid_ids = {url_id(r.get('url_id')) for r in data if url_id(r.get('url_id'))}
    remove_stale_pages(out, valid_ids)
    for r in data:
        uid = url_id(r.get('url_id'))
        if not uid:
            continue
        detail = detail_page(r.get(ja_col,''), r.get(en_col,''), data, id_col, ja_col, en_col, uid, folder)
        (out / f'{uid}.html').write_text(layout(r.get(ja_col,'') or r.get(en_col,''), detail, 1), encoding='utf-8')

    if folder == 'characters':
        body = '''<div class="page-heading"><h1 id="page-title">Characters</h1><div class="page-sub" id="page-sub">キャラクター</div></div><ul id="character-list" class="character-list"></ul>'''
        script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-title').textContent=t('characters');document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'キャラクター';async function load(){const r=await fetch('/kagamito/pages/characters.csv');const rows=parseCSV(await r.text()).filter(c=>c.url_id&&(c.name_ja||c.name_en));const list=document.getElementById('character-list');list.innerHTML='';rows.forEach(c=>{const li=document.createElement('li'),a=document.createElement('a');a.href=`${String(c.url_id).toLowerCase().replace(/\\./g,'-')}.html`;const ep=document.createElement('span');ep.className='character-epithet';const main=document.createElement('span');main.className='list-main';const jp=document.createElement('span');jp.className='list-japanese';if(getLanguage()==='en'){ep.textContent=c.epithet_en||c.epithet_ja||'';main.textContent=c.name_en||c.name_ja||'';jp.textContent=c.name_ja||'';a.append(ep,main,jp)}else{ep.textContent=c.epithet_ja||c.epithet_en||'';main.textContent=c.name_ja||c.name_en||'';a.append(ep,main)}li.appendChild(a);list.appendChild(li)})}load();</script>'''
    elif folder == 'works':
        body = '''<div class="page-heading"><h1 id="page-title">Works</h1><div class="page-sub" id="page-sub">作品</div></div><ul id="entity-list" class="character-list"></ul>'''
        script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-title').textContent=t('works');document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'作品';</script><script>renderList('works').catch(e=>console.error(e));</script>'''
    else:
        body = '''<div class="page-heading"><h1 id="page-title">Songs</h1><div class="page-sub" id="page-sub">楽曲</div></div><ul id="entity-list" class="character-list"></ul>'''
        script = '''<script>document.documentElement.lang=getLanguage();document.getElementById('page-title').textContent=t('songs');document.getElementById('page-sub').textContent=getLanguage()==='en'?'':'楽曲';</script><script>renderList('songs').catch(e=>console.error(e));</script>'''

    page = layout(label, body, 1)[:-7] + script + '</body></html>'
    (out / 'index.html').write_text(page, encoding='utf-8')


def main():
    build_entity('characters.csv', 'characters', 'character_id', 'name_ja', 'name_en', 'Characters')
    build_entity('works.csv', 'works', 'work_id', 'title_ja', 'title_en', 'Works')
    build_entity('songs.csv', 'songs', 'song_id', 'title_ja', 'title_en', 'Songs')


if __name__ == '__main__':
    main()
