import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from "@/lib/supabase/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

type EventList = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  class: { name: string } | null;
};

const EventListPage = async ({
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
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
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

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(new Date(item.start_time))}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.start_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.end_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
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
    .from("events")
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      class_id,
      classes (
        name
      )
    `)
    .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

  // Apply role-based filtering
  if (role !== "admin" && currentUserId) {
    if (role === "student") {
      // Get student's class
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", currentUserId)
        .single();
      
      if (studentData) {
        query = query.or(`class_id.is.null,class_id.eq.${studentData.class_id}`);
      } else {
        query = query.is("class_id", null);
      }
    } else if (role === "teacher") {
      // Get teacher's classes
      const { data: teacherClasses } = await supabase
        .from("lessons")
        .select("class_id")
        .eq("teacher_id", currentUserId);
      
      const classIds = teacherClasses?.map(lesson => lesson.class_id) || [];
      if (classIds.length > 0) {
        query = query.or(`class_id.is.null,class_id.in.(${classIds.join(",")})`);
      } else {
        query = query.is("class_id", null);
      }
    } else if (role === "parent") {
      // Get parent's children's classes
      const { data: childrenData } = await supabase
        .from("students")
        .select("class_id")
        .eq("parent_id", currentUserId);
      
      const classIds = childrenData?.map(child => child.class_id) || [];
      if (classIds.length > 0) {
        query = query.or(`class_id.is.null,class_id.in.(${classIds.join(",")})`);
      } else {
        query = query.is("class_id", null);
      }
    }
  }

  // Apply search filter
  if (queryParams.search) {
    query = query.ilike("title", `%${queryParams.search}%`);
  }

  const { data: eventsData } = await query;
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true });

  // Transform data to match expected format
  const data = (eventsData || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start_time: event.start_time,
    end_time: event.end_time,
    class: event.classes ? { name: event.classes.name } : null
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="event" type="create" />}
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

export default EventListPage;