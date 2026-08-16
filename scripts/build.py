"""Build all production site pages into _site.

The individual builders remain responsible for their own page families;
this module is the single production build entrypoint used by CI.
"""

from build_glossary import main as build_glossary
from build_site import main as build_entities


def main():
    build_entities()
    build_glossary()


if __name__ == '__main__':
    main()
