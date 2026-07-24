-- Encryption upgrade (XOR -> AES-256-GCM, server-stored key).
-- Run in the Supabase SQL editor BEFORE deploying the new client code.
--
-- Model: each user gets a random AES-256 key, generated client-side on first
-- use and stored here. The client fetches it (RLS: only the owner can read
-- their profile row) and encrypts/decrypts locally with AES-GCM.
-- This replaces the old XOR-with-user-id scheme with real, tamper-evident
-- cryptography. Note it is not end-to-end: someone with direct database
-- access could read the key. A passphrase-wrapped "private vault" mode can
-- be layered on later without changing the data format.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS encryption_key text;
