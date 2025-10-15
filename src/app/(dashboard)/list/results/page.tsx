import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from "@/lib/supabase/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

type ResultList = {
  id: number;
  score: number;
  student: { name: string; surname: string };
  exam?: { title: string; start_time: string };
  assignment?: { title: string; start_date: string };
  lesson: {
    class: { name: string };
    teacher: { name: string; surname: string };
  };
};

const ResultListPage = async ({
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
      header: "Title",
      accessor: "title",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Score",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
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

  const renderRow = (item: ResultList) => {
    const title = item.exam?.title || item.assignment?.title || "";
    const date = item.exam?.start_time || item.assignment?.start_date || "";
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{title}</td>
        <td>{item.student.name + " " + item.student.surname}</td>
        <td className="hidden md:table-cell">{item.score}</td>
        <td className="hidden md:table-cell">
          {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
        </td>
        <td className="hidden md:table-cell">{item.lesson.class.name}</td>
        <td className="hidden md:table-cell">
          {new Intl.DateTimeFormat("en-US").format(new Date(date))}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="result" type="update" data={item} />
                <FormContainer table="result" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build base query
  let query = supabase
    .from("results")
    .select(`
      id,
      score,
      student_id,
      students (
        name,
        surname
      ),
      exams (
        title,
        start_time,
        lessons (
          classes (
            name
          ),
          teachers (
            name,
            surname
          )
        )
      ),
      assignments (
        title,
        start_date,
        lessons (
          classes (
            name
          ),
          teachers (
            name,
            surname
          )
        )
      )
    `)
    .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

  // Apply role-based filtering
  if (role === "student" && currentUserId) {
    query = query.eq("student_id", currentUserId);
  } else if (role === "parent" && currentUserId) {
    query = query.eq("students.parent_id", currentUserId);
  } else if (role === "teacher" && currentUserId) {
    query = query.or(`exams.lessons.teacher_id.eq.${currentUserId},assignments.lessons.teacher_id.eq.${currentUserId}`);
  }

  // Apply search filter
  if (queryParams.search) {
    query = query.or(`exams.title.ilike.%${queryParams.search}%,assignments.title.ilike.%${queryParams.search}%,students.name.ilike.%${queryParams.search}%`);
  }

  const { data: resultsData } = await query;
  const { count } = await supabase
    .from("results")
    .select("*", { count: "exact", head: true });

  // Transform data to match expected format
  const data = (resultsData || []).map((result: any) => ({
    id: result.id,
    score: result.score,
    student: {
      name: result.students?.name || "",
      surname: result.students?.surname || ""
    },
    exam: result.exams ? {
      title: result.exams.title,
      start_time: result.exams.start_time
    } : undefined,
    assignment: result.assignments ? {
      title: result.assignments.title,
      start_date: result.assignments.start_date
    } : undefined,
    lesson: {
      class: {
        name: result.exams?.lessons?.classes?.name || result.assignments?.lessons?.classes?.name || ""
      },
      teacher: {
        name: result.exams?.lessons?.teachers?.name || result.assignments?.lessons?.teachers?.name || "",
        surname: result.exams?.lessons?.teachers?.surname || result.assignments?.lessons?.teachers?.surname || ""
      }
    }
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
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
              <FormContainer table="result" type="create" />
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

export default ResultListPage;