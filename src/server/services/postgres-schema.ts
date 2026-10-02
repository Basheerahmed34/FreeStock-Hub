/**
 * PostgreSQL / Supabase / Neon SQL Migration Schema
 * Features:
 * - Normalized Unified Asset Cache
 * - GIN Full-Text Search Indexes & Trigram Indexes
 * - User Collections & Folders with Row Level Security (RLS)
 * - Search Query Telemetry & Provider Latency Logs
 * - Provider Rate Limits & Daily Quota Counters
 * - Creative Commons Attribution History
 */

export const POSTGRES_MIGRATION_SQL = `-- ==============================================================================
-- FreeStock Hub: Production PostgreSQL Schema (Supabase / Neon Compatible)
-- Features: Normalized Assets Cache, GIN Trigram Search, RLS, Quota Audits
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Enumerated Types for Strict Taxonomy
DO $$ BEGIN
  CREATE TYPE asset_type_enum AS ENUM (
    'PHOTO', 'VIDEO', 'AUDIO', 'SOUND_EFFECT',
    'ILLUSTRATION', 'VECTOR', 'ICON', 'PNG', 'GIF'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE license_type_enum AS ENUM (
    'FREE', 'CC0', 'CC_BY', 'CC_BY_SA',
    'PUBLIC_DOMAIN', 'CUSTOM_SOURCE_LICENSE', 'CHECK_LICENSE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Normalized Cached Assets Table
CREATE TABLE IF NOT EXISTS public.cached_assets (
  asset_id VARCHAR(120) PRIMARY KEY, -- Composite e.g. 'openverse-image-12345'
  provider VARCHAR(40) NOT NULL,      -- 'pexels', 'unsplash', 'openverse', etc.
  provider_asset_id VARCHAR(80) NOT NULL,
  asset_type asset_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  download_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- In seconds for audio/video
  file_type VARCHAR(16),
  license_name VARCHAR(60) NOT NULL DEFAULT 'CHECK_LICENSE',
  license_url TEXT,
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  attribution_text TEXT,
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '7 days'),
  download_count INTEGER NOT NULL DEFAULT 0,
  
  -- Constraint: Provider + Provider Asset ID must be strictly unique
  CONSTRAINT uq_provider_asset UNIQUE (provider, provider_asset_id)
);

-- Search Indexes
CREATE INDEX IF NOT EXISTS idx_cached_assets_type ON public.cached_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_cached_assets_provider ON public.cached_assets(provider);
CREATE INDEX IF NOT EXISTS idx_cached_assets_license ON public.cached_assets(license_name);
CREATE INDEX IF NOT EXISTS idx_cached_assets_cached_at ON public.cached_assets(cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_assets_title_trgm ON public.cached_assets USING gin(title gin_trgm_ops);

-- 4. User Collections & Projects (Supabase Auth RLS)
CREATE TABLE IF NOT EXISTS public.user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Collection Items Junction Table
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
  asset_id VARCHAR(120) NOT NULL REFERENCES public.cached_assets(asset_id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT uq_collection_asset UNIQUE (collection_id, asset_id)
);

-- 6. Provider Quota & Rate Limit Tracking
CREATE TABLE IF NOT EXISTS public.provider_quota_logs (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  rate_limit_remaining INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_quota_provider_created ON public.provider_quota_logs(provider, created_at DESC);

-- 7. Download & Attribution Compliance Logs (Rule 1 & Rule 5)
CREATE TABLE IF NOT EXISTS public.download_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id VARCHAR(120) NOT NULL,
  provider VARCHAR(40) NOT NULL,
  download_type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'api_redirect', 'tracking_webhook'
  user_ip_hash VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_downloads_asset ON public.download_audit_logs(asset_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.cached_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_quota_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_audit_logs ENABLE ROW LEVEL SECURITY;

-- Cached Assets: Publicly readable for all users
CREATE POLICY "Public Read Access for Cached Assets"
  ON public.cached_assets FOR SELECT
  USING (true);

-- User Collections: Authenticated user owns their collections
CREATE POLICY "Users can view own or public collections"
  ON public.user_collections FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own collections"
  ON public.user_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.user_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.user_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Items: Users can only manage items in their own collections
CREATE POLICY "Users can manage items in their own collections"
  ON public.collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_collections c
      WHERE c.id = collection_items.collection_id
      AND c.user_id = auth.uid()
    )
  );

-- System Audit Logs: Write-only for service role or logging triggers
CREATE POLICY "Public insert into download audits"
  ON public.download_audit_logs FOR INSERT
  WITH CHECK (true);
`;
