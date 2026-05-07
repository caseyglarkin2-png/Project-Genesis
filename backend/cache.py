"""SQLite-backed response cache for Mapbox / Overpass calls.

Keeps the dragnet cheap and idempotent. Two tables:
  - kv: generic key/value with TTL (geocode hits, OSM responses, scoring results)
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from contextlib import contextmanager
from typing import Any, Optional

DB_PATH = os.environ.get('GENESIS_CACHE_DB', os.path.join(os.path.dirname(__file__), 'cache.db'))
DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days — OSM/yard footprints don't move


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS kv (
            namespace TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            stored_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            PRIMARY KEY (namespace, key)
        )
        """
    )
    return conn


@contextmanager
def _cursor():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def get(namespace: str, key: str) -> Optional[Any]:
    with _cursor() as conn:
        row = conn.execute(
            'SELECT value, expires_at FROM kv WHERE namespace=? AND key=?',
            (namespace, key),
        ).fetchone()
    if not row:
        return None
    value, expires_at = row
    if expires_at < int(time.time()):
        return None
    return json.loads(value)


def set(namespace: str, key: str, value: Any, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> None:
    now = int(time.time())
    with _cursor() as conn:
        conn.execute(
            'INSERT OR REPLACE INTO kv (namespace, key, value, stored_at, expires_at) VALUES (?, ?, ?, ?, ?)',
            (namespace, key, json.dumps(value), now, now + ttl_seconds),
        )
