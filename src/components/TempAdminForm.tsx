"use client";

import { useState } from "react";
import { TempAdminRecord } from "@/lib/temp-admin";
import { toast } from "react-toastify";

interface TempAdminFormProps {
  currentUserId: string;
  onSuccess: (tempAdmin: TempAdminRecord) => void;
  onCancel: () => void;
}

const TempAdminForm = ({ currentUserId, onSuccess, onCancel }: TempAdminFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    customPassword: '',
    useCustomPassword: false,
    expiresAt: '',
    reason: '',
    permissions: ['admin'] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expiresAt = new Date(formData.expiresAt);
      if (expiresAt <= new Date()) {
        toast.error('Expiration date must be in the future');
        return;
      }

      const response = await fetch('/api/temp-admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.useCustomPassword ? formData.customPassword : undefined,
          expiresAt: expiresAt.toISOString(),
          permissions: formData.permissions,
          createdBy: currentUserId,
          reason: formData.reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Temporary admin created successfully');
        if (result.password) {
          setGeneratedPassword(result.password);
        }
        onSuccess(result.tempAdmin);
      } else {
        toast.error(result.error || 'Failed to create temporary admin');
      }
    } catch (error) {
      console.error('Error creating temp admin:', error);
      toast.error('An error occurred while creating temporary admin');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission),
    }));
  };

  // Set default expiration to 24 hours from now
  const getDefaultExpiration = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  if (generatedPassword) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Temporary Admin Created</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Important:</strong> Save this password securely. It will not be shown again.
          </p>
          <div className="bg-white border rounded p-2 font-mono text-sm">
            {generatedPassword}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedPassword);
              toast.success('Password copied to clipboard');
            }}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            Copy Password
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Create Temporary Admin</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.useCustomPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, useCustomPassword: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Use custom password</span>
          </label>
          {formData.useCustomPassword && (
            <input
              type="password"
              required
              minLength={8}
              value={formData.customPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, customPassword: e.target.value }))}
              className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter secure password (min 8 characters)"
            />
          )}
          {!formData.useCustomPassword && (
            <p className="text-xs text-gray-500 mt-1">
              A secure password will be generated automatically
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expires At
          </label>
          <input
            type="datetime-local"
            required
            value={formData.expiresAt || getDefaultExpiration()}
            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Access
          </label>
          <textarea
            required
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Explain why temporary admin access is needed..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="space-y-2">
            {['admin', 'teacher', 'student', 'parent'].map(permission => (
              <label key={permission} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission)}
                  onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                />
                <span className="text-sm text-gray-700 capitalize">{permission}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Temp Admin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TempAdminForm;