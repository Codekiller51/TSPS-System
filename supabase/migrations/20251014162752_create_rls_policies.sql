/*
  # Row Level Security Policies

  1. Security Overview
    - Admins have full access to all data
    - Teachers can view and manage their own data and related classes/lessons
    - Students can view their own data and related information
    - Parents can view their children's data
    - All policies check authentication and role/ownership

  2. Role Detection
    - Uses custom claims in JWT for role identification
    - Roles: admin, teacher, student, parent

  3. Policies by Table
    - Each table has specific policies for SELECT, INSERT, UPDATE, DELETE
    - Policies are restrictive by default
*/

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'authenticated'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Admins table policies
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can view their own record"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Parents table policies
CREATE POLICY "Admins can view all parents"
  ON parents FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Parents can view their own profile"
  ON parents FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert parents"
  ON parents FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update parents"
  ON parents FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Parents can update their own profile"
  ON parents FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete parents"
  ON parents FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Grades table policies (read by all authenticated users)
CREATE POLICY "Authenticated users can view grades"
  ON grades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert grades"
  ON grades FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update grades"
  ON grades FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete grades"
  ON grades FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Subjects table policies
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Teachers table policies
CREATE POLICY "Admins can view all teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Teachers can view their own profile"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can view their teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM lessons l
      INNER JOIN students s ON s.class_id = l.class_id
      WHERE l.teacher_id = teachers.id AND s.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update teachers"
  ON teachers FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can update their own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Classes table policies
CREATE POLICY "Admins can view all classes"
  ON classes FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Teachers can view their classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    (
      supervisor_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.class_id = classes.id AND lessons.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view their class"
  ON classes FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.class_id = classes.id AND students.id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'parent' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.class_id = classes.id AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Students table policies
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view students in their classes"
  ON students FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.class_id = students.class_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'parent' AND
    parent_id = auth.uid()
  );

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Students can update their own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Teacher subjects junction table policies
CREATE POLICY "Authenticated users can view teacher subjects"
  ON teacher_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teacher subjects"
  ON teacher_subjects FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Lessons table policies
CREATE POLICY "Admins can view all lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Teachers can view their lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    teacher_id = auth.uid()
  );

CREATE POLICY "Students can view their class lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.class_id = lessons.class_id AND students.id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'parent' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.class_id = lessons.class_id AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete lessons"
  ON lessons FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Exams table policies
CREATE POLICY "Admins can view all exams"
  ON exams FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Teachers can view exams for their lessons"
  ON exams FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = exams.lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their class exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM lessons l
      INNER JOIN students s ON s.class_id = l.class_id
      WHERE l.id = exams.lesson_id AND s.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can insert exams for their lessons"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can update their lesson exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = exams.lesson_id AND lessons.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete exams"
  ON exams FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Assignments table policies
CREATE POLICY "Admins can view all assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Teachers can view assignments for their lessons"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = assignments.lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their class assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM lessons l
      INNER JOIN students s ON s.class_id = l.class_id
      WHERE l.id = assignments.lesson_id AND s.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Results table policies
CREATE POLICY "Admins can view all results"
  ON results FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Students can view their own results"
  ON results FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    student_id = auth.uid()
  );

CREATE POLICY "Teachers can view results for their students"
  ON results FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    (
      EXISTS (
        SELECT 1 FROM exams e
        INNER JOIN lessons l ON l.id = e.lesson_id
        WHERE e.id = results.exam_id AND l.teacher_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM assignments a
        INNER JOIN lessons l ON l.id = a.lesson_id
        WHERE a.id = results.assignment_id AND l.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Parents can view their children's results"
  ON results FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'parent' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = results.student_id AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage results"
  ON results FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can insert results"
  ON results FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'teacher' AND
    (
      EXISTS (
        SELECT 1 FROM exams e
        INNER JOIN lessons l ON l.id = e.lesson_id
        WHERE e.id = exam_id AND l.teacher_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM assignments a
        INNER JOIN lessons l ON l.id = a.lesson_id
        WHERE a.id = assignment_id AND l.teacher_id = auth.uid()
      )
    )
  );

-- Attendances table policies
CREATE POLICY "Admins can view all attendances"
  ON attendances FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Students can view their own attendance"
  ON attendances FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'student' AND
    student_id = auth.uid()
  );

CREATE POLICY "Teachers can view attendance for their lessons"
  ON attendances FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = attendances.lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's attendance"
  ON attendances FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'parent' AND
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendances.student_id AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage attendances"
  ON attendances FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can manage attendance for their lessons"
  ON attendances FOR ALL
  TO authenticated
  USING (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = attendances.lesson_id AND lessons.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_id AND lessons.teacher_id = auth.uid()
    )
  );

-- Events table policies
CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    class_id IS NULL OR
    get_user_role() = 'admin' OR
    (
      get_user_role() = 'student' AND
      EXISTS (
        SELECT 1 FROM students
        WHERE students.class_id = events.class_id AND students.id = auth.uid()
      )
    ) OR
    (
      get_user_role() = 'teacher' AND
      EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.class_id = events.class_id AND lessons.teacher_id = auth.uid()
      )
    ) OR
    (
      get_user_role() = 'parent' AND
      EXISTS (
        SELECT 1 FROM students
        WHERE students.class_id = events.class_id AND students.parent_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Announcements table policies
CREATE POLICY "Authenticated users can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    class_id IS NULL OR
    get_user_role() = 'admin' OR
    (
      get_user_role() = 'student' AND
      EXISTS (
        SELECT 1 FROM students
        WHERE students.class_id = announcements.class_id AND students.id = auth.uid()
      )
    ) OR
    (
      get_user_role() = 'teacher' AND
      EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.class_id = announcements.class_id AND lessons.teacher_id = auth.uid()
      )
    ) OR
    (
      get_user_role() = 'parent' AND
      EXISTS (
        SELECT 1 FROM students
        WHERE students.class_id = announcements.class_id AND students.parent_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');