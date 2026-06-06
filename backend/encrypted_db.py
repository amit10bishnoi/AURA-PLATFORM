"""
encrypted_db.py — Transparent Encrypted MongoDB Collection Wrappers
Drop-in replacements for Motor collections that auto-encrypt on write
and auto-decrypt on read.

Usage (in any route):
    from encrypted_db import ecol
    
    # Instead of: col("users")
    # Use:        ecol("users")
    
    await ecol("users").insert_one(doc)        # auto-encrypts PHI
    await ecol("users").find_one({"id": uid})  # auto-decrypts PHI
"""
from encryption import encrypt_doc, decrypt_doc, decrypt_docs
from database import col as _raw_col
import logging

log = logging.getLogger("aura.encrypted_db")


class EncryptedCollection:
    """
    Wraps a Motor collection to transparently encrypt on write
    and decrypt on read for all PHI fields.
    """

    def __init__(self, collection_name: str):
        self._name = collection_name
        self._col = _raw_col(collection_name)

    # ── Write operations (encrypt before storing) ─────────────────────────────

    async def insert_one(self, document: dict, *args, **kwargs):
        encrypted = encrypt_doc(document, self._name)
        return await self._col.insert_one(encrypted, *args, **kwargs)

    async def insert_many(self, documents: list, *args, **kwargs):
        encrypted = [encrypt_doc(d, self._name) for d in documents]
        return await self._col.insert_many(encrypted, *args, **kwargs)

    async def update_one(self, filter_: dict, update: dict, *args, **kwargs):
        if "$set" in update:
            update = dict(update)
            update["$set"] = encrypt_doc(update["$set"], self._name)
        return await self._col.update_one(filter_, update, *args, **kwargs)

    async def update_many(self, filter_: dict, update: dict, *args, **kwargs):
        if "$set" in update:
            update = dict(update)
            update["$set"] = encrypt_doc(update["$set"], self._name)
        return await self._col.update_many(filter_, update, *args, **kwargs)

    async def replace_one(self, filter_: dict, replacement: dict, *args, **kwargs):
        encrypted = encrypt_doc(replacement, self._name)
        return await self._col.replace_one(filter_, encrypted, *args, **kwargs)

    # ── Read operations (decrypt after fetching) ──────────────────────────────

    async def find_one(self, filter_: dict = None, *args, **kwargs):
        doc = await self._col.find_one(filter_ or {}, *args, **kwargs)
        return decrypt_doc(doc, self._name) if doc else None

    def find(self, filter_: dict = None, *args, **kwargs):
        return EncryptedCursor(
            self._col.find(filter_ or {}, *args, **kwargs), self._name
        )

    async def count_documents(self, filter_: dict, *args, **kwargs):
        return await self._col.count_documents(filter_, *args, **kwargs)

    async def delete_one(self, filter_: dict, *args, **kwargs):
        return await self._col.delete_one(filter_, *args, **kwargs)

    async def delete_many(self, filter_: dict, *args, **kwargs):
        return await self._col.delete_many(filter_, *args, **kwargs)

    async def distinct(self, key: str, filter_: dict = None, *args, **kwargs):
        return await self._col.distinct(key, filter_ or {}, *args, **kwargs)

    async def create_indexes(self, indexes, *args, **kwargs):
        return await self._col.create_indexes(indexes, *args, **kwargs)

    # ── Pass-through for anything else ────────────────────────────────────────
    def __getattr__(self, name):
        return getattr(self._col, name)


class EncryptedCursor:
    """Wraps a Motor cursor to decrypt docs as they're fetched."""

    def __init__(self, cursor, collection_name: str):
        self._cursor = cursor
        self._name = collection_name

    async def to_list(self, length=None):
        docs = await self._cursor.to_list(length)
        return decrypt_docs(docs, self._name)

    def sort(self, *args, **kwargs):
        self._cursor = self._cursor.sort(*args, **kwargs)
        return self

    def skip(self, n):
        self._cursor = self._cursor.skip(n)
        return self

    def limit(self, n):
        self._cursor = self._cursor.limit(n)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            doc = await self._cursor.__anext__()
            return decrypt_doc(doc, self._name)
        except StopAsyncIteration:
            raise


def ecol(name: str) -> EncryptedCollection:
    """
    Returns an encrypted collection wrapper.
    Drop-in replacement for col() from database.py.
    """
    return EncryptedCollection(name)


# ── Convenience accessors (mirror database.py) ────────────────────────────────

def users():         return ecol("users")
def tenants():       return ecol("tenants")
def assessments():   return ecol("assessments")
def tasks():         return ecol("tasks")
def vendors():       return ecol("vendors")
def policies():      return ecol("policies")
def evidence():      return ecol("evidence")
def audit_logs():    return ecol("audit_logs")
def risk_items():    return ecol("risk_items")
def notifications(): return ecol("notifications")
def controls():      return ecol("controls")