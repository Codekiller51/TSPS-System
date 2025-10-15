import { createClient } from "@/lib/supabase/server";
import { TempAdminManager } from "@/lib/temp-admin";
import TempAdminList from "@/components/TempAdminList";
import { redirect } from "next/navigation";

const TempAdminsPage = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Only allow access to main admins
  if (!user || user.user_metadata?.role !== 'admin' || user.user_metadata?.temp_admin) {
    redirect('/admin');
  }

  const tempAdminManager = new TempAdminManager();
  const { success, tempAdmins, error } = await tempAdminManager.listTempAdmins(true);

  if (!success) {
    console.error('Failed to load temp admins:', error);
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Temporary Admin Management</h1>
            <p className="text-gray-600 mt-1">Create and manage temporary administrator accounts</p>
          </div>
        </div>

        <TempAdminList 
          initialTempAdmins={tempAdmins || []} 
          currentUserId={user.id}
        />
      </div>
    </div>
  );
};

export default TempAdminsPage;