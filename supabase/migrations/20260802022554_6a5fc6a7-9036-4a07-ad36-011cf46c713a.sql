ALTER TABLE public.event_invited_readers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_invited_readers;