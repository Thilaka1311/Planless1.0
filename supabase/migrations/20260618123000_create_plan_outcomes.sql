-- Migration: Consolidate legacy memory outcomes into a unified plan_outcomes table.
DROP TABLE IF EXISTS public.memory_movie_verdicts CASCADE;
DROP TABLE IF EXISTS public.memory_restaurant_votes CASCADE;
DROP TABLE IF EXISTS public.memory_match_results CASCADE;
DROP TABLE IF EXISTS public.memory_mvp_votes CASCADE;
DROP TABLE IF EXISTS public.memory_badminton_results CASCADE;

CREATE TABLE public.plan_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  submitted_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  outcome_type VARCHAR(50) NOT NULL, -- 'review', 'stats', 'mvp_vote'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, submitted_by_user_id, outcome_type)
);
