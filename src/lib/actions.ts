"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import { createClient } from "./supabase/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const supabase = await createClient();

    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert({ name: data.name })
      .select()
      .single();

    if (subjectError) throw subjectError;

    if (data.teachers && data.teachers.length > 0) {
      const { error: junctionError } = await supabase
        .from("teacher_subjects")
        .insert(
          data.teachers.map((teacherId) => ({
            teacher_id: teacherId,
            subject_id: subject.id,
          }))
        );

      if (junctionError) throw junctionError;
    }

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    if (!data.id) return { success: false, error: true };

    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from("subjects")
      .update({ name: data.name })
      .eq("id", data.id);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("teacher_subjects")
      .delete()
      .eq("subject_id", data.id);

    if (deleteError) throw deleteError;

    if (data.teachers && data.teachers.length > 0) {
      const { error: insertError } = await supabase
        .from("teacher_subjects")
        .insert(
          data.teachers.map((teacherId) => ({
            teacher_id: teacherId,
            subject_id: data.id!,
          }))
        );

      if (insertError) throw insertError;
    }

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("classes").insert({
      name: data.name,
      capacity: data.capacity,
      supervisor_id: data.supervisorId || null,
      grade_id: data.gradeId,
    });

    if (error) throw error;

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    if (!data.id) return { success: false, error: true };

    const supabase = await createClient();

    const { error } = await supabase
      .from("classes")
      .update({
        name: data.name,
        capacity: data.capacity,
        supervisor_id: data.supervisorId || null,
        grade_id: data.gradeId,
      })
      .eq("id", data.id);

    if (error) throw error;

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${data.username}@school.com`,
      password: data.password,
      options: {
        data: {
          role: "teacher",
          username: data.username,
          name: data.name,
          surname: data.surname,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    const { error: teacherError } = await supabase.from("teachers").insert({
      id: authData.user.id,
      username: data.username,
      name: data.name,
      surname: data.surname,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      img: data.img || null,
      blood_type: data.bloodType,
      sex: data.sex,
      birthday: data.birthday,
    });

    if (teacherError) throw teacherError;

    if (data.subjects && data.subjects.length > 0) {
      const { error: subjectsError } = await supabase
        .from("teacher_subjects")
        .insert(
          data.subjects.map((subjectId: string) => ({
            teacher_id: authData.user!.id,
            subject_id: parseInt(subjectId),
          }))
        );

      if (subjectsError) throw subjectsError;
    }

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();

    if (data.password && data.password !== "") {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (authError) throw authError;
    }

    const { error: teacherError } = await supabase
      .from("teachers")
      .update({
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        blood_type: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
      })
      .eq("id", data.id);

    if (teacherError) throw teacherError;

    const { error: deleteError } = await supabase
      .from("teacher_subjects")
      .delete()
      .eq("teacher_id", data.id);

    if (deleteError) throw deleteError;

    if (data.subjects && data.subjects.length > 0) {
      const { error: subjectsError } = await supabase
        .from("teacher_subjects")
        .insert(
          data.subjects.map((subjectId: string) => ({
            teacher_id: data.id!,
            subject_id: parseInt(subjectId),
          }))
        );

      if (subjectsError) throw subjectsError;
    }

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const supabase = await createClient();

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("capacity")
      .eq("id", data.classId)
      .single();

    if (classError) throw classError;

    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("class_id", data.classId);

    if (count !== null && classData.capacity <= count) {
      return { success: false, error: true };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${data.username}@school.com`,
      password: data.password,
      options: {
        data: {
          role: "student",
          username: data.username,
          name: data.name,
          surname: data.surname,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    const { error: studentError } = await supabase.from("students").insert({
      id: authData.user.id,
      username: data.username,
      name: data.name,
      surname: data.surname,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      img: data.img || null,
      blood_type: data.bloodType,
      sex: data.sex,
      birthday: data.birthday,
      grade_id: data.gradeId,
      class_id: data.classId,
      parent_id: data.parentId,
    });

    if (studentError) throw studentError;

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();

    if (data.password && data.password !== "") {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (authError) throw authError;
    }

    const { error: studentError } = await supabase
      .from("students")
      .update({
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        blood_type: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        grade_id: data.gradeId,
        class_id: data.classId,
        parent_id: data.parentId,
      })
      .eq("id", data.id);

    if (studentError) throw studentError;

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("exams").insert({
      title: data.title,
      start_time: data.startTime,
      end_time: data.endTime,
      lesson_id: data.lessonId,
    });

    if (error) throw error;

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    if (!data.id) return { success: false, error: true };

    const supabase = await createClient();

    const { error } = await supabase
      .from("exams")
      .update({
        title: data.title,
        start_time: data.startTime,
        end_time: data.endTime,
        lesson_id: data.lessonId,
      })
      .eq("id", data.id);

    if (error) throw error;

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
