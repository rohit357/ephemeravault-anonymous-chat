
-- Create room_members table to track active members
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, username)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can leave" ON public.room_members FOR DELETE USING (true);

CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
