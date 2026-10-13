-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — MIGRATION 15
-- Add banner_url column if not present and ensure tournaments table supports extended prize distribution
-- ====================================================================

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Index on banner_url for fast queries if needed
COMMENT ON COLUMN public.tournaments.banner_url IS 'URL or Base64 Image thumbnail string for the tournament banner';
COMMENT ON COLUMN public.tournaments.prize_distribution IS 'JSON storing prize breakdown up to 10th place: first, second, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth';
