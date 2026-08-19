from pathlib import Path

from build_data import DATA
from yaml_content import export_yaml_directory

ROOT = Path(__file__).resolve().parents[1]
SITE_DATA = ROOT / '_site' / 'data'


def main():
    export_yaml_directory(DATA / 'characters', SITE_DATA / 'characters')
    export_yaml_directory(DATA / 'glossary', SITE_DATA / 'glossary')


if __name__ == '__main__':
    main()
