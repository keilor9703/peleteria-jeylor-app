
# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# SQLALCHEMY_DATABASE_URL = "sqlite:///./sales.db"

# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()


# import os
# from sqlalchemy import create_engine
# url = os.getenv("DATABASE_URL", "sqlite:///../sales.db")
# engine = create_engine(url, pool_pre_ping=True)

# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# backend/database.py (al final del archivo, después de definir engine/SessionLocal/Base)


def run_migrations():
    with engine.connect() as conn:
        # Agregar stock_actual si no existe
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _schema_meta(key TEXT PRIMARY KEY, value TEXT);
        """))
        # Chequea si ya migraste
        already = conn.execute(text("SELECT value FROM _schema_meta WHERE key='inv_v1'")).fetchone()
        if already:
            return

        # Intenta agregar columnas (SQLite soporta ALTER ADD COLUMN)
        try:
            conn.execute(text("ALTER TABLE productos ADD COLUMN stock_actual REAL DEFAULT 0"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE productos ADD COLUMN stock_minimo REAL DEFAULT 0"))
        except Exception:
            pass

        # Crea tabla movements si no existe (lo hará models.py/create_all, pero por si acaso)
        # Aquí no creamos directo porque lo maneja Base.metadata.create_all

        # Marca migración ejecutada
        # conn.execute(text("INSERT OR REPLACE INTO _schema_meta(key, value) VALUES('inv_v1','done')"))
        conn.execute(text("""
                                INSERT INTO _schema_meta(key, value)
                                VALUES ('inv_v1', 'done')
                                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                            """))

        conn.commit()

# Llama a run_migrations() desde main.py después de create_all()
