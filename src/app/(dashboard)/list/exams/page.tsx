import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from "@/lib/supabase/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

type ExamList = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  lesson: {
    subject: { name: string };
    class: { name: string };
    teacher: { name: string; surname: string };
  };
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string;
  const currentUserId = user?.id;

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: ExamList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
      <td>{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(new Date(item.start_time))}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="exam" type="update" data={item} />
              <FormContainer table="exam" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build base query
  let query = supabase
    .from("exams")
    .select(`
      id,
      title,
      start_time,
      end_time,
      lessons (
        id,
        name,
        teacher_id,
        class_id,
        subjects (
          name
        ),
        classes (
          name
        ),
        teachers (
          name,
          surname
        )
      )
    `)
    .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

  // Apply role-based filtering
  if (role === "teacher" && currentUserId) {
    query = query.eq("lessons.teacher_id", currentUserId);
  } else if (role === "student" && currentUserId) {
    // Get student's class first
    const { data: studentData } = await supabase
      .from("students")
      .select("class_id")
      .eq("id", currentUserId)
      .single();
    
    if (studentData) {
      query = query.eq("lessons.class_id", studentData.class_id);
    }
  } else if (role === "parent" && currentUserId) {
    // Get parent's children's classes
    const { data: childrenData } = await supabase
      .from("students")
      .select("class_id")
      .eq("parent_id", currentUserId);
    
    if (childrenData && childrenData.length > 0) {
      const classIds = childrenData.map(child => child.class_id);
      query = query.in("lessons.class_id", classIds);
    }
  }

  // Apply search filter
  if (queryParams.search) {
    query = query.ilike("lessons.subjects.name", `%${queryParams.search}%`);
  }

  const { data: examsData } = await query;
  const { count } = await supabase
    .from("exams")
    .select("*", { count: "exact", head: true });

  // Transform data to match expected format
  const data = (examsData || []).map((exam: any) => ({
    id: exam.id,
    title: exam.title,
    start_time: exam.start_time,
    end_time: exam.end_time,
    lesson: {
      subject: { name: exam.lessons?.subjects?.name || "" },
      class: { name: exam.lessons?.classes?.name || "" },
      teacher: {
        name: exam.lessons?.teachers?.name || "",
        surname: exam.lessons?.teachers?.surname || ""
      }
    }
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="exam" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count || 0} />
    </div>
  );
};

export default ExamListPage;