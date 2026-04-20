
-- =========================================================
-- ROOMS: remove public SELECT/DELETE, keep INSERT open
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON public.rooms;
-- Keep "Anyone can create rooms" (INSERT) as-is so unauthenticated users can still create.

-- =========================================================
-- MESSAGES: remove public SELECT/DELETE, keep INSERT open
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;

-- Allow SELECT only for messages whose room_id exists in rooms (prevents broad enumeration
-- via REST without first knowing a room id; combined with rooms SELECT being closed,
-- the only path to data is via the RPCs below).
CREATE POLICY "Read messages of existing rooms"
ON public.messages
FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = messages.room_id));

-- =========================================================
-- ROOM_MEMBERS: remove permissive DELETE, restrict SELECT to existing rooms
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view members" ON public.room_members;
DROP POLICY IF EXISTS "Anyone can leave" ON public.room_members;

CREATE POLICY "Read members of existing rooms"
ON public.room_members
FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_members.room_id));

-- =========================================================
-- HELPER FUNCTION: look up a room by its code (replaces direct SELECT on rooms)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_room_by_code(_code text)
RETURNS TABLE (id uuid, code text, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.code, r.name
  FROM public.rooms r
  WHERE r.code = upper(_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_room_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_room_by_code(text) TO anon, authenticated;

-- =========================================================
-- HELPER FUNCTION: leave a room (delete only your own membership;
-- if no members remain, auto-delete the room and its messages)
-- =========================================================
CREATE OR REPLACE FUNCTION public.leave_room(_room_id uuid, _username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
BEGIN
  DELETE FROM public.room_members
   WHERE room_id = _room_id
     AND username = _username;

  SELECT COUNT(*) INTO remaining
    FROM public.room_members
   WHERE room_id = _room_id;

  IF remaining = 0 THEN
    DELETE FROM public.messages WHERE room_id = _room_id;
    DELETE FROM public.rooms    WHERE id      = _room_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_room(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.leave_room(uuid, text) TO anon, authenticated;
