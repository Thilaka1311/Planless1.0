-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recommended Indexes
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Clients should not be able to read, update, or delete analytics events.
-- Service role / backend can insert and query.
-- By default in Supabase, when RLS is enabled, all access is denied.
-- Since the service_role bypasses RLS, we only need to define policies if we want to restrict
-- other roles or allow service_role explicitly. Let's explicitly define policies for service_role.
CREATE POLICY "Allow service_role insert" ON public.analytics_events
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service_role select" ON public.analytics_events
  FOR SELECT TO service_role USING (true);
