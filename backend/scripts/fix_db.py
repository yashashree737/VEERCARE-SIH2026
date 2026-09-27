import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import engine
from sqlalchemy import text

def fix_db():
    with engine.connect() as conn:
        dialect = engine.dialect.name
        if dialect == "sqlite":
            result = conn.execute(text("PRAGMA table_info(users);")).fetchall()
            columns = [row[1] for row in result]
            
            if "unit_id" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN unit_id INTEGER;"))
                conn.commit()
                print("Added unit_id to SQLite users table")
            if "hashed_password" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255);"))
                conn.commit()
                print("Added hashed_password to SQLite users table")
        else:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_id INTEGER;"))
                conn.commit()
                print("Added unit_id")
            except Exception as e:
                print("unit_id error:", e)
                
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);"))
                conn.commit()
                print("Added hashed_password")
            except Exception as e:
                print("hashed_password error:", e)
                
            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN supabase_user_id DROP NOT NULL;"))
                conn.commit()
                print("Made supabase_user_id nullable")
            except Exception as e:
                print("supabase_user_id error:", e)

if __name__ == "__main__":
    fix_db()
