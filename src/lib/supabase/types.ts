export type UserSex = 'MALE' | 'FEMALE';
export type Day = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface Admin {
  id: string;
  username: string;
  created_at: string;
}

export interface Parent {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string;
  address: string;
  created_at: string;
}

export interface Grade {
  id: number;
  level: number;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Teacher {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  address: string;
  img: string | null;
  blood_type: string;
  sex: UserSex;
  birthday: string;
  created_at: string;
}

export interface Class {
  id: number;
  name: string;
  capacity: number;
  supervisor_id: string | null;
  grade_id: number;
}

export interface Student {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  address: string;
  img: string | null;
  blood_type: string;
  sex: UserSex;
  birthday: string;
  parent_id: string;
  class_id: number;
  grade_id: number;
  created_at: string;
}

export interface TeacherSubject {
  teacher_id: string;
  subject_id: number;
}

export interface Lesson {
  id: number;
  name: string;
  day: Day;
  start_time: string;
  end_time: string;
  subject_id: number;
  class_id: number;
  teacher_id: string;
}

export interface Exam {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  lesson_id: number;
}

export interface Assignment {
  id: number;
  title: string;
  start_date: string;
  due_date: string;
  lesson_id: number;
}

export interface Result {
  id: number;
  score: number;
  exam_id: number | null;
  assignment_id: number | null;
  student_id: string;
}

export interface Attendance {
  id: number;
  date: string;
  present: boolean;
  student_id: string;
  lesson_id: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  class_id: number | null;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  class_id: number | null;
}

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: Admin;
        Insert: Omit<Admin, 'created_at'>;
        Update: Partial<Omit<Admin, 'id' | 'created_at'>>;
      };
      parents: {
        Row: Parent;
        Insert: Omit<Parent, 'created_at'>;
        Update: Partial<Omit<Parent, 'id' | 'created_at'>>;
      };
      grades: {
        Row: Grade;
        Insert: Omit<Grade, 'id'>;
        Update: Partial<Omit<Grade, 'id'>>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id'>;
        Update: Partial<Omit<Subject, 'id'>>;
      };
      teachers: {
        Row: Teacher;
        Insert: Omit<Teacher, 'created_at'>;
        Update: Partial<Omit<Teacher, 'id' | 'created_at'>>;
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, 'id'>;
        Update: Partial<Omit<Class, 'id'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'created_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at'>>;
      };
      teacher_subjects: {
        Row: TeacherSubject;
        Insert: TeacherSubject;
        Update: never;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id'>;
        Update: Partial<Omit<Lesson, 'id'>>;
      };
      exams: {
        Row: Exam;
        Insert: Omit<Exam, 'id'>;
        Update: Partial<Omit<Exam, 'id'>>;
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, 'id'>;
        Update: Partial<Omit<Assignment, 'id'>>;
      };
      results: {
        Row: Result;
        Insert: Omit<Result, 'id'>;
        Update: Partial<Omit<Result, 'id'>>;
      };
      attendances: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id'>;
        Update: Partial<Omit<Attendance, 'id'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id'>;
        Update: Partial<Omit<Event, 'id'>>;
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, 'id'>;
        Update: Partial<Omit<Announcement, 'id'>>;
      };
    };
  };
}
