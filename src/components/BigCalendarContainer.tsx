import { createClient } from "@/lib/supabase/server";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const supabase = await createClient();
  
  let query = supabase
    .from("lessons")
    .select("name, start_time, end_time");
    
  if (type === "teacherId") {
    query = query.eq("teacher_id", id as string);
  } else {
    query = query.eq("class_id", id as number);
  }
  
  const { data: dataRes } = await query;

  const data = (dataRes || []).map((lesson) => ({
    title: lesson.name,
    start: new Date(lesson.start_time),
    end: new Date(lesson.end_time),
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
