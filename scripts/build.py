"""Build all production site pages into _site.

The individual builders remain responsible for their own page families;
this module is the single production build entrypoint used by CI.
"""

from build_entities import main as build_entities
from build_glossary import main as build_glossary
from build_yaml import main as build_yaml
from build_sitemap import main as build_sitemap


def main():
    build_entities()
    build_glossary()
    build_yaml()
    build_sitemap()


if __name__ == '__main__':
    main()
