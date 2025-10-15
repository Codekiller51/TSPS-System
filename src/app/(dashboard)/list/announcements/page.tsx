import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from "@/lib/supabase/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

type AnnouncementList = {
  id: number;
  title: string;
  description: string;
  date: string;
  class: { name: string } | null;
};

const AnnouncementListPage = async ({
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
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(new Date(item.date))}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
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
    .from("announcements")
    .select(`
      id,
      title,
      description,
      date,
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

  const { data: announcementsData } = await query;
  const { count } = await supabase
    .from("announcements")
    .select("*", { count: "exact", head: true });

  // Transform data to match expected format
  const data = (announcementsData || []).map((announcement: any) => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    date: announcement.date,
    class: announcement.classes ? { name: announcement.classes.name } : null
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Announcements
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="announcement" type="create" />
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

export default AnnouncementListPage;