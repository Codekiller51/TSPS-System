"use client";

import { useState, useEffect } from "react";
import { TempAdminRecord } from "@/lib/temp-admin";
import TempAdminForm from "./TempAdminForm";
import { toast } from "react-toastify";
import Image from "next/image";

interface TempAdminListProps {
  initialTempAdmins: TempAdminRecord[];
  currentUserId: string;
}

const TempAdminList = ({ initialTempAdmins, currentUserId }: TempAdminListProps) => {
  const [tempAdmins, setTempAdmins] = useState<TempAdminRecord[]>(initialTempAdmins);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRevoke = async (tempAdminId: string) => {
    if (!confirm('Are you sure you want to revoke this temporary admin access?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/temp-admin/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempAdminId, 
          revokedBy: currentUserId,
          reason: 'Manually revoked by admin'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Temporary admin access revoked successfully');
        // Update the local state
        setTempAdmins(prev => 
          prev.map(ta => 
            ta.id === tempAdminId 
              ? { ...ta, isActive: false, revokedAt: new Date(), revokedBy: currentUserId }
              : ta
          )
        );
      } else {
        toast.error(result.error || 'Failed to revoke temporary admin');
      }
    } catch (error) {
      console.error('Error revoking temp admin:', error);
      toast.error('An error occurred while revoking temporary admin');
    } finally {
      setLoading(false);
    }
  };

  const handleTempAdminCreated = (newTempAdmin: TempAdminRecord) => {
    setTempAdmins(prev => [newTempAdmin, ...prev]);
    setShowForm(false);
  };

  const getStatusBadge = (tempAdmin: TempAdminRecord) => {
    const now = new Date();
    
    if (!tempAdmin.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Revoked</span>;
    }
    
    if (tempAdmin.expiresAt <= now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Expired</span>;
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Temporary Administrators</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Image src="/create.png" alt="" width={16} height={16} />
          Create Temp Admin
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <TempAdminForm
              currentUserId={currentUserId}
              onSuccess={handleTempAdminCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Expires</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Created By</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Last Used</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tempAdmins.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No temporary administrators found
                </td>
              </tr>
            ) : (
              tempAdmins.map((tempAdmin) => (
                <tr key={tempAdmin.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{tempAdmin.email}</td>
                  <td className="py-3 px-4">{getStatusBadge(tempAdmin)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(tempAdmin.expiresAt)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{tempAdmin.createdBy}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {tempAdmin.reason}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {tempAdmin.lastUsed ? formatDate(tempAdmin.lastUsed) : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    {tempAdmin.isActive && tempAdmin.expiresAt > new Date() && (
                      <button
                        onClick={() => handleRevoke(tempAdmin.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <Image src="/delete.png" alt="Revoke" width={16} height={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TempAdminList;