import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const supabase = await createClient();
  
  const tableMap: Record<typeof type, string> = {
    admin: "admins",
    teacher: "teachers", 
    student: "students",
    parent: "parents",
  };

  const { count } = await supabase
    .from(tableMap[type])
    .select("*", { count: "exact", head: true });

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count || 0}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
    </div>
  );
};

export default UserCard;
