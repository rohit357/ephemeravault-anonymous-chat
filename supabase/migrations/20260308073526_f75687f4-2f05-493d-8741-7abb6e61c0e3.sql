
-- Drop all restrictive policies and recreate as permissive

-- messages
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;

CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete messages" ON public.messages FOR DELETE USING (true);

-- room_members
DROP POLICY IF EXISTS "Anyone can join" ON public.room_members;
DROP POLICY IF EXISTS "Anyone can leave" ON public.room_members;
DROP POLICY IF EXISTS "Anyone can view members" ON public.room_members;

CREATE POLICY "Anyone can view members" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can leave" ON public.room_members FOR DELETE USING (true);

-- rooms
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete rooms" ON public.rooms FOR DELETE USING (true);
