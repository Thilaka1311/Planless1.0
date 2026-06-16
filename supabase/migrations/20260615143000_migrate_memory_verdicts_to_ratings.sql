-- Migration: Migrate movie verdicts and restaurant votes to ratings and reviews.
-- 1. Drop check constraints
ALTER TABLE public.memory_movie_verdicts DROP CONSTRAINT IF EXISTS memory_movie_verdicts_verdict_check;
ALTER TABLE public.memory_restaurant_votes DROP CONSTRAINT IF EXISTS memory_restaurant_votes_vote_check;

-- 2. Add columns
ALTER TABLE public.memory_movie_verdicts ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.memory_movie_verdicts ADD COLUMN IF NOT EXISTS review TEXT;

ALTER TABLE public.memory_restaurant_votes ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.memory_restaurant_votes ADD COLUMN IF NOT EXISTS review TEXT;

-- 3. Backfill data
UPDATE public.memory_movie_verdicts SET rating = CASE 
  WHEN verdict = 'loved_it' THEN 5 
  WHEN verdict = 'good' THEN 4 
  WHEN verdict = 'not_for_me' THEN 2 
  ELSE 3 -- fallback
END WHERE rating IS NULL;

UPDATE public.memory_restaurant_votes SET rating = CASE 
  WHEN vote = 'yes' THEN 5 
  WHEN vote = 'maybe' THEN 3 
  WHEN vote = 'no' THEN 1 
  ELSE 3 -- fallback
END WHERE rating IS NULL;

-- 4. Alter rating to be NOT NULL now that data is backfilled
ALTER TABLE public.memory_movie_verdicts ALTER COLUMN rating SET NOT NULL;
ALTER TABLE public.memory_restaurant_votes ALTER COLUMN rating SET NOT NULL;

-- 5. Drop old columns
ALTER TABLE public.memory_movie_verdicts DROP COLUMN IF EXISTS verdict;
ALTER TABLE public.memory_restaurant_votes DROP COLUMN IF EXISTS vote;
