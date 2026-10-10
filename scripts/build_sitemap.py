"""Generate sitemap.xml from the HTML pages actually built for publication."""

from pathlib import Path
from urllib.parse import quote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
BASE_URL = 'https://kagami-to.github.io'
SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
GOOGLE_VERIFICATION_FILE = 'google000af6034246c3e4.html'


def public_url_for_html(path):
    """Convert a built HTML file path to its public URL."""
    relative = path.relative_to(SITE)
    if relative.name == 'index.html':
        relative_url = relative.parent.as_posix()
        if relative_url == '.':
            relative_url = ''
        else:
            relative_url += '/'
    else:
        relative_url = quote(relative.as_posix(), safe='/-._~')
    return f'{BASE_URL}/{relative_url}'


def main():
    if not SITE.is_dir():
        raise RuntimeError(f'Published site directory does not exist: {SITE}')

    ET.register_namespace('', SITEMAP_NS)
    urlset = ET.Element(f'{{{SITEMAP_NS}}}urlset')

    html_files = sorted(
        path for path in SITE.rglob('*.html')
        if path.is_file() and path.name != GOOGLE_VERIFICATION_FILE
    )

    for path in html_files:
        url = ET.SubElement(urlset, f'{{{SITEMAP_NS}}}url')
        ET.SubElement(url, f'{{{SITEMAP_NS}}}loc').text = public_url_for_html(path)

    if not html_files:
        raise RuntimeError(f'No HTML pages found under {SITE}; sitemap was not generated.')

    output = SITE / 'sitemap.xml'
    tree = ET.ElementTree(urlset)
    ET.indent(tree, space='  ')
    tree.write(output, encoding='utf-8', xml_declaration=True)


if __name__ == '__main__':
    main()
