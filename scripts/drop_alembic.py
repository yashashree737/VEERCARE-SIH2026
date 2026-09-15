import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import engine
from sqlalchemy import text

def drop_alembic():
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE alembic_version"))
            conn.commit()
            print("Dropped alembic_version table.")
        except Exception as e:
            print(f"Error or already dropped: {e}")

if __name__ == "__main__":
    drop_alembic()
