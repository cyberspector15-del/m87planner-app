-- Award OMV only when a user completes one of their high-priority tasks.
-- `reference_id` makes the mission award traceable and, together with the
-- partial unique index, prevents duplicate awards even under concurrent calls.
ALTER TABLE public.omv_transactions
  ADD COLUMN IF NOT EXISTS reference_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS omv_transactions_mission_complete_once_idx
  ON public.omv_transactions (user_id, reference_id)
  WHERE reason = 'mission_complete' AND reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.complete_task_and_award_omv(
  p_task_id uuid,
  p_completed boolean
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
  v_was_completed boolean;
  v_awarded boolean := false;
BEGIN
  SELECT completed
  INTO v_was_completed
  FROM public.tasks
  WHERE id = p_task_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  UPDATE public.tasks
  SET completed = p_completed
  WHERE id = p_task_id
    AND user_id = auth.uid()
  RETURNING * INTO v_task;

  IF p_completed
    AND NOT COALESCE(v_was_completed, false)
    AND v_task.priority = 1 THEN
    INSERT INTO public.omv_transactions (user_id, amount, reason, reference_id)
    SELECT auth.uid(), 5, 'mission_complete', p_task_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.omv_transactions
      WHERE user_id = auth.uid()
        AND reason = 'mission_complete'
        AND reference_id = p_task_id
    )
    ON CONFLICT (user_id, reference_id)
      WHERE reason = 'mission_complete' AND reference_id IS NOT NULL
      DO NOTHING
    RETURNING true INTO v_awarded;

    IF COALESCE(v_awarded, false) THEN
      UPDATE public.profiles
      SET omv_balance = COALESCE(omv_balance, 0) + 5
      WHERE user_id = auth.uid();
    END IF;
  END IF;

  RETURN v_task;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_task_and_award_omv(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_task_and_award_omv(uuid, boolean) TO authenticated;
