"""Copy all portfolio content (including images) from the local SQLite
database into another database, e.g. the Postgres database on Render.

    cd backend
    venv/bin/python scripts/copy_to_database.py

You are asked for the target database URL (use Render's *External* Database
URL). It is read without echoing, so it never lands in your shell history.

Safety:
- Everything is copied in a single transaction: all or nothing.
- If the target already has content, the script stops. Pass --replace to
  wipe the target's portfolio tables and copy again.
- Row counts are compared afterwards.
"""
import argparse
import getpass
import os
import sys

from sqlalchemy import create_engine, func, select, text

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from models import db  # noqa: E402  (registers every table on db.metadata)

SOURCE_URL = 'sqlite:///' + os.path.join(BACKEND, 'instance', 'portfolio.db')
TABLES = [t for t in db.metadata.sorted_tables]  # parents before children


def normalise(url):
    url = url.strip()
    for prefix in ('postgres://', 'postgresql://'):
        if url.startswith(prefix):
            url = 'postgresql+psycopg2://' + url[len(prefix):]
    is_local = '@localhost' in url or '@127.0.0.1' in url
    if url.startswith('postgresql') and 'sslmode=' not in url and not is_local:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    return url


def counts(connection):
    return {t.name: connection.execute(select(func.count()).select_from(t)).scalar() for t in TABLES}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--replace', action='store_true', help='delete existing content in the target first')
    args = parser.parse_args()

    if not os.path.isfile(SOURCE_URL.replace('sqlite:///', '')):
        sys.exit(f'Local database not found: {SOURCE_URL}')

    target_url = os.environ.get('TARGET_DATABASE_URL') or getpass.getpass('Target database URL (input hidden): ')
    if not target_url.strip():
        sys.exit('No database URL given.')

    source = create_engine(SOURCE_URL)
    target = create_engine(normalise(target_url))

    with source.connect() as src:
        source_counts = counts(src)
        rows = {t.name: [dict(r._mapping) for r in src.execute(select(t))] for t in TABLES}

    print('Local content:')
    for name, n in source_counts.items():
        print(f'  {name:<18} {n}')

    with target.begin() as dst:  # one transaction for everything below
        db.metadata.create_all(bind=dst)

        existing = {k: v for k, v in counts(dst).items() if v}
        if existing and not args.replace:
            sys.exit('\nThe target database already has content '
                     f'({", ".join(f"{k}: {v}" for k, v in existing.items())}).\n'
                     'Nothing was changed. Run again with --replace to overwrite it.')
        if existing:
            print('\n--replace: clearing existing content in the target...')
            for table in reversed(TABLES):  # children before parents
                dst.execute(table.delete())

        print('\nCopying...')
        for table in TABLES:
            if rows[table.name]:
                dst.execute(table.insert(), rows[table.name])
            print(f'  {table.name:<18} {len(rows[table.name])}')

        # Postgres hands out ids from sequences; move them past the copied ids
        # so new items created in admin mode don't collide.
        if dst.dialect.name == 'postgresql':
            for table in TABLES:
                id_col = table.columns.get('id')
                if id_col is not None and id_col.type.python_type is int:
                    dst.execute(text(
                        f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM \"{table.name}\"), 0) + 1, false)"))

        mismatched = {k: (source_counts[k], v) for k, v in counts(dst).items() if v != source_counts[k]}
        if mismatched:
            raise RuntimeError(f'Row counts do not match, rolling back: {mismatched}')

    print('\nDone. Every table matches the local database.')


if __name__ == '__main__':
    main()
