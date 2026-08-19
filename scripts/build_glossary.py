from pathlib import Path
import csv, shutil

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
SITE = ROOT / '_site'
LIST_TEMPLATE = ROOT / 'templates' / 'glossary-list.html'
DETAIL_TEMPLATE = ROOT / 'templates' / 'glossary-detail.html'


def list_layout(body):
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glossary - Kagamito Official</title><link rel="stylesheet" href="../assets/css/style.css"><link rel="stylesheet" href="../assets/css/entity-cards.css"><link rel="stylesheet" href="../assets/css/glossary-list.css"></head><body><header class="site-header"><a href="../" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header><main class="container">{body}</main><script src="../assets/js/csv.js"></script><script src="../assets/js/language.js"></script><script src="../assets/js/entity-common.js"></script><script src="../assets/js/entity-cards.js"></script><script src="../assets/js/glossary-sort.js"></script><script src="../assets/js/glossary-pages.js"></script><script>document.documentElement.lang=getLanguage();initGlossaryList().catch(e=>console.error(e));</script><script src="../assets/js/menu-data.js"></script><script src="../assets/js/menu.js"></script></body></html>'''


def detail_layout(body, term_id):
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glossary - Kagamito Official</title><link rel="stylesheet" href="../../assets/css/style.css"><link rel="stylesheet" href="../../assets/css/entity-cards.css"><link rel="stylesheet" href="../../assets/css/glossary-detail.css"><link rel="stylesheet" href="../../assets/css/yaml-content.css"></head><body data-glossary-id="{term_id}"><header class="site-header"><a href="../" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header><main>{body}</main><script src="../../assets/js/csv.js"></script><script src="../../assets/js/language.js"></script><script src="../../assets/js/entity-common.js"></script><script src="../../assets/js/entity-cards.js"></script><script src="../../assets/js/glossary-sort.js"></script><script src="../../assets/js/yaml-content.js"></script><script src="../../assets/js/glossary-detail.js"></script><script src="../../assets/js/menu-data.js"></script><script src="../../assets/js/menu.js"></script></body></html>'''


def main():
    src = DATA / 'glossary.csv'
    if not src.exists(): return
    out = SITE / 'glossary'; out.mkdir(parents=True, exist_ok=True)
    site_data = SITE / 'data'; site_data.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, site_data / 'glossary.csv')

    yaml_src = DATA / 'glossary'
    yaml_dst = site_data / 'glossary'; yaml_dst.mkdir(parents=True, exist_ok=True)
    for y in yaml_src.glob('*.yaml'):
        shutil.copy2(y, yaml_dst / y.name)

    body = LIST_TEMPLATE.read_text(encoding='utf-8'); (out / 'index.html').write_text(list_layout(body), encoding='utf-8')
    detail_body = DETAIL_TEMPLATE.read_text(encoding='utf-8')
    with src.open(encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            term_id = (row.get('term_id') or '').strip(); url_id = (row.get('url_id') or '').strip()
            if not term_id or not url_id: continue
            page_dir = out / url_id; page_dir.mkdir(parents=True, exist_ok=True)
            (page_dir / 'index.html').write_text(detail_layout(detail_body, term_id), encoding='utf-8')

if __name__ == '__main__': main()
