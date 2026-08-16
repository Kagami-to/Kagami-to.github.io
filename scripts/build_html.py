"""Shared HTML helpers for the production site build."""

import html


# Keep browser zoom disabled consistently on every generated page.
VIEWPORT = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no'


def esc(value):
    return html.escape(value or '', quote=True)


def site_header(prefix):
    return f'''<header class="site-header"><a href="{prefix}" class="site-title"><span class="site-title-ja">鏡外 - </span>Kagamito Official Site</a><nav></nav></header>'''


def _entity_scripts(prefix, extra_scripts=''):
    return f'''<script src="{prefix}assets/js/data.js"></script><script src="{prefix}assets/js/language.js"></script><script src="{prefix}assets/js/entity-common.js"></script><script src="{prefix}assets/js/entity-cards.js"></script><script src="{prefix}assets/js/entity-list-data.js"></script><script src="{prefix}assets/js/glossary-sort.js"></script>{extra_scripts}'''


def layout(title, body, depth=0, extra_head='', extra_body=''):
    prefix = '../' * depth
    scripts = _entity_scripts(prefix, f'<script src="{prefix}assets/js/entity-pages.js"></script>{extra_body}')
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="{VIEWPORT}"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{extra_head}</head><body>{site_header(prefix)}<main class="container">{body}</main>{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''


def entity_detail_layout(title, body, pager, extra_head, extra_scripts, depth=1, main_open='', main_close=''):
    prefix = '../' * depth
    scripts = _entity_scripts(prefix, extra_scripts)
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="{VIEWPORT}"><title>{esc(title)} - Kagamito Official</title><link rel="stylesheet" href="{prefix}assets/css/style.css"><link rel="stylesheet" href="{prefix}assets/css/entity-cards.css">{extra_head}</head><body>{site_header(prefix)}{pager}{main_open}{body}{main_close}{scripts}<script src="{prefix}assets/js/menu.js"></script></body></html>'''
