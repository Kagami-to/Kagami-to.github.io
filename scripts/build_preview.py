from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
PREVIEW = ROOT / 'preview'


def main():
    """Copy versioned preview pages into the Pages artifact.

    Preview sources remain outside the normal site build. The production build
    calls this script only when previews are intentionally published.
    """
    if not PREVIEW.exists():
        return

    target = SITE / 'preview'
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(PREVIEW, target)


if __name__ == '__main__':
    main()
