/*
  # School Management System Database Schema

  1. Enums
    - UserSex: MALE, FEMALE
    - Day: MONDAY through FRIDAY

  2. New Tables
    - `admins` - Administrator accounts
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `created_at` (timestamptz)

    - `parents` - Parent/guardian information
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `name` (text)
      - `surname` (text)
      - `email` (text, unique)
      - `phone` (text, unique)
      - `address` (text)
      - `created_at` (timestamptz)

    - `grades` - Academic grade levels
      - `id` (integer, primary key)
      - `level` (integer, unique)

    - `subjects` - Academic subjects
      - `id` (integer, primary key)
      - `name` (text, unique)

    - `teachers` - Teacher accounts and information
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `name` (text)
      - `surname` (text)
      - `email` (text, unique)
      - `phone` (text, unique)
      - `address` (text)
      - `img` (text)
      - `blood_type` (text)
      - `sex` (user_sex enum)
      - `birthday` (date)
      - `created_at` (timestamptz)

    - `classes` - Class/classroom information
      - `id` (integer, primary key)
      - `name` (text, unique)
      - `capacity` (integer)
      - `supervisor_id` (uuid, foreign key to teachers)
      - `grade_id` (integer, foreign key to grades)

    - `students` - Student accounts and information
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `name` (text)
      - `surname` (text)
      - `email` (text, unique)
      - `phone` (text, unique)
      - `address` (text)
      - `img` (text)
      - `blood_type` (text)
      - `sex` (user_sex enum)
      - `birthday` (date)
      - `parent_id` (uuid, foreign key to parents)
      - `class_id` (integer, foreign key to classes)
      - `grade_id` (integer, foreign key to grades)
      - `created_at` (timestamptz)

    - `teacher_subjects` - Many-to-many relationship between teachers and subjects
      - `teacher_id` (uuid, foreign key to teachers)
      - `subject_id` (integer, foreign key to subjects)

    - `lessons` - Class lessons/periods
      - `id` (integer, primary key)
      - `name` (text)
      - `day` (day enum)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `subject_id` (integer, foreign key to subjects)
      - `class_id` (integer, foreign key to classes)
      - `teacher_id` (uuid, foreign key to teachers)

    - `exams` - Exam information
      - `id` (integer, primary key)
      - `title` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `lesson_id` (integer, foreign key to lessons)

    - `assignments` - Assignment/homework information
      - `id` (integer, primary key)
      - `title` (text)
      - `start_date` (timestamptz)
      - `due_date` (timestamptz)
      - `lesson_id` (integer, foreign key to lessons)

    - `results` - Exam and assignment results
      - `id` (integer, primary key)
      - `score` (integer)
      - `exam_id` (integer, foreign key to exams, nullable)
      - `assignment_id` (integer, foreign key to assignments, nullable)
      - `student_id` (uuid, foreign key to students)

    - `attendances` - Student attendance records
      - `id` (integer, primary key)
      - `date` (date)
      - `present` (boolean)
      - `student_id` (uuid, foreign key to students)
      - `lesson_id` (integer, foreign key to lessons)

    - `events` - School events
      - `id` (integer, primary key)
      - `title` (text)
      - `description` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `class_id` (integer, foreign key to classes, nullable)

    - `announcements` - School announcements
      - `id` (integer, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (timestamptz)
      - `class_id` (integer, foreign key to classes, nullable)

  3. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Create enums
CREATE TYPE user_sex AS ENUM ('MALE', 'FEMALE');
CREATE TYPE day AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level integer UNIQUE NOT NULL
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE,
  address text NOT NULL,
  img text,
  blood_type text NOT NULL,
  sex user_sex NOT NULL,
  birthday date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL,
  capacity integer NOT NULL,
  supervisor_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  grade_id integer NOT NULL REFERENCES grades(id) ON DELETE CASCADE
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE,
  address text NOT NULL,
  img text,
  blood_type text NOT NULL,
  sex user_sex NOT NULL,
  birthday date NOT NULL,
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  grade_id integer NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create teacher_subjects junction table
CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id integer REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  day day NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  subject_id integer NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  start_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  score integer NOT NULL,
  exam_id integer REFERENCES exams(id) ON DELETE CASCADE,
  assignment_id integer REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT check_exam_or_assignment CHECK (
    (exam_id IS NOT NULL AND assignment_id IS NULL) OR
    (exam_id IS NULL AND assignment_id IS NOT NULL)
  )
);

-- Create attendances table
CREATE TABLE IF NOT EXISTS attendances (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date date NOT NULL,
  present boolean NOT NULL DEFAULT false,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  description text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  class_id integer REFERENCES classes(id) ON DELETE CASCADE
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  description text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  class_id integer REFERENCES classes(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id);
CREATE INDEX IF NOT EXISTS idx_classes_supervisor_id ON classes(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_lesson_id ON attendances(lesson_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_assignment_id ON results(assignment_id);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;