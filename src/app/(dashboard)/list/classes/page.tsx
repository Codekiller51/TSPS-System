import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from "@/lib/supabase/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

type ClassList = {
  id: number;
  name: string;
  capacity: number;
  supervisor: { name: string; surname: string } | null;
  grade_level: number;
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string;

  const columns = [
    {
      header: "Class Name",
      accessor: "name",
    },
    {
      header: "Capacity",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: ClassList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">{item.capacity}</td>
      <td className="hidden md:table-cell">{item.grade_level}</td>
      <td className="hidden md:table-cell">
        {item.supervisor ? item.supervisor.name + " " + item.supervisor.surname : "-"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="class" type="update" data={item} />
              <FormContainer table="class" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build query
  let query = supabase
    .from("classes")
    .select(`
      id,
      name,
      capacity,
      supervisor_id,
      teachers!classes_supervisor_id_fkey (
        name,
        surname
      ),
      grades (
        level
      )
    `)
    .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

  // Apply filters
  if (queryParams.supervisorId) {
    query = query.eq("supervisor_id", queryParams.supervisorId);
  }
  if (queryParams.search) {
    query = query.ilike("name", `%${queryParams.search}%`);
  }

  const { data: classesData } = await query;
  const { count } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true });

  // Transform data to match expected format
  const data = (classesData || []).map((classItem: any) => ({
    id: classItem.id,
    name: classItem.name,
    capacity: classItem.capacity,
    supervisor: classItem.teachers || null,
    grade_level: classItem.grades?.level || 0
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="class" type="create" />}
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

export default ClassListPage;