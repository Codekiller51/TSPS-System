import { createClient } from "@/lib/supabase/server";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const supabase = await createClient();
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  
  const { data: attendance } = await supabase
    .from("attendances")
    .select("present")
    .eq("student_id", id)
    .gte("date", startOfYear);

  const totalDays = attendance?.length || 0;
  const presentDays = attendance?.filter((day) => day.present).length || 0;
  const percentage = (presentDays / totalDays) * 100;
  return (
    <div className="">
      <h1 className="text-xl font-semibold">{percentage || "-"}%</h1>
      <span className="text-sm text-gray-400">Attendance</span>
    </div>
  );
};

export default StudentAttendanceCard;
