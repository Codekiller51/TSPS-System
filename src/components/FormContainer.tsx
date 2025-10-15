import { createClient } from "@/lib/supabase/server";
import FormModal from "./FormModal";
import { createClient as createClientServer } from "@/lib/supabase/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string;
  const currentUserId = user?.id;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const { data: subjectTeachers } = await supabase
          .from("teachers")
          .select("id, name, surname");
        relatedData = { teachers: subjectTeachers || [] };
        break;
      case "class":
        const { data: classGrades } = await supabase
          .from("grades")
          .select("id, level");
        const { data: classTeachers } = await supabase
          .from("teachers")
          .select("id, name, surname");
        relatedData = { 
          teachers: classTeachers || [], 
          grades: classGrades || [] 
        };
        break;
      case "teacher":
        const { data: teacherSubjects } = await supabase
          .from("subjects")
          .select("id, name");
        relatedData = { subjects: teacherSubjects || [] };
        break;
      case "student":
        const { data: studentGrades } = await supabase
          .from("grades")
          .select("id, level");
        const { data: studentClasses } = await supabase
          .from("classes")
          .select(`
            id,
            name,
            capacity,
            students (count)
          `);
        relatedData = { 
          classes: studentClasses || [], 
          grades: studentGrades || [] 
        };
        break;
      case "exam":
        let lessonsQuery = supabase
          .from("lessons")
          .select("id, name");
        
        if (role === "teacher" && currentUserId) {
          lessonsQuery = lessonsQuery.eq("teacher_id", currentUserId);
        }
        
        const { data: examLessons } = await lessonsQuery;
        relatedData = { lessons: examLessons || [] };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
