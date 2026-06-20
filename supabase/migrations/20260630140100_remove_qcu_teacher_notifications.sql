-- Retirer les notifications enseignant à chaque QCU validé.

drop trigger if exists trg_notify_teachers_qcu_validated on public.student_lesson_module_progress;
drop function if exists app.notify_teachers_qcu_validated();
