import { createClient } from './supabase/server';
import { createClient as createClientBrowser } from './supabase/client';
import crypto from 'crypto';

export interface TempAdminConfig {
  email: string;
  password?: string; // Optional - will generate if not provided
  expiresAt: Date;
  permissions: string[];
  createdBy: string;
  reason: string;
}

export interface TempAdminRecord {
  id: string;
  email: string;
  expiresAt: Date;
  permissions: string[];
  createdBy: string;
  reason: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

export class TempAdminManager {
  private supabase;

  constructor(isServer = true) {
    this.supabase = isServer ? createClient() : createClientBrowser();
  }

  /**
   * Generate a secure random password
   */
  private generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Create a temporary admin account
   */
  async createTempAdmin(config: TempAdminConfig): Promise<{
    success: boolean;
    tempAdmin?: TempAdminRecord;
    password?: string;
    error?: string;
  }> {
    try {
      const supabase = await createClient();
      
      // Generate password if not provided
      const password = config.password || this.generateSecurePassword();
      
      // Validate expiration date
      if (config.expiresAt <= new Date()) {
        return { success: false, error: 'Expiration date must be in the future' };
      }

      // Check if email already exists as temp admin
      const { data: existingTempAdmin } = await supabase
        .from('temp_admins')
        .select('*')
        .eq('email', config.email)
        .eq('is_active', true)
        .single();

      if (existingTempAdmin) {
        return { success: false, error: 'Active temporary admin already exists with this email' };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: config.email,
        password: password,
        options: {
          data: {
            role: 'temp_admin',
            temp_admin: true,
            permissions: config.permissions,
            expires_at: config.expiresAt.toISOString(),
          },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create auth user' };
      }

      // Create temp admin record
      const tempAdminData = {
        id: authData.user.id,
        email: config.email,
        expires_at: config.expiresAt.toISOString(),
        permissions: config.permissions,
        created_by: config.createdBy,
        reason: config.reason,
        is_active: true,
      };

      const { data: tempAdmin, error: tempAdminError } = await supabase
        .from('temp_admins')
        .insert(tempAdminData)
        .select()
        .single();

      if (tempAdminError) {
        // Cleanup auth user if temp admin creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: tempAdminError.message };
      }

      // Log the creation
      await this.logAuditEvent({
        action: 'CREATE_TEMP_ADMIN',
        tempAdminId: authData.user.id,
        performedBy: config.createdBy,
        details: {
          email: config.email,
          permissions: config.permissions,
          expiresAt: config.expiresAt,
          reason: config.reason,
        },
      });

      return {
        success: true,
        tempAdmin: {
          id: tempAdmin.id,
          email: tempAdmin.email,
          expiresAt: new Date(tempAdmin.expires_at),
          permissions: tempAdmin.permissions,
          createdBy: tempAdmin.created_by,
          reason: tempAdmin.reason,
          isActive: tempAdmin.is_active,
          createdAt: new Date(tempAdmin.created_at),
        },
        password: config.password ? undefined : password, // Only return generated password
      };
    } catch (error) {
      console.error('Error creating temp admin:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Revoke temporary admin access
   */
  async revokeTempAdmin(tempAdminId: string, revokedBy: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Update temp admin record
      const { error: updateError } = await supabase
        .from('temp_admins')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          revoke_reason: reason,
        })
        .eq('id', tempAdminId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Disable auth user
      const { error: authError } = await supabase.auth.admin.updateUserById(
        tempAdminId,
        { user_metadata: { disabled: true } }
      );

      if (authError) {
        console.error('Failed to disable auth user:', authError);
      }

      // Log the revocation
      await this.logAuditEvent({
        action: 'REVOKE_TEMP_ADMIN',
        tempAdminId,
        performedBy: revokedBy,
        details: { reason },
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking temp admin:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Check if temp admin is valid and update last used
   */
  async validateTempAdmin(tempAdminId: string): Promise<{
    isValid: boolean;
    tempAdmin?: TempAdminRecord;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      const { data: tempAdmin, error } = await supabase
        .from('temp_admins')
        .select('*')
        .eq('id', tempAdminId)
        .eq('is_active', true)
        .single();

      if (error || !tempAdmin) {
        return { isValid: false, error: 'Temporary admin not found or inactive' };
      }

      const now = new Date();
      const expiresAt = new Date(tempAdmin.expires_at);

      if (now > expiresAt) {
        // Auto-revoke expired temp admin
        await this.revokeTempAdmin(tempAdminId, 'SYSTEM', 'Expired');
        return { isValid: false, error: 'Temporary admin access has expired' };
      }

      // Update last used timestamp
      await supabase
        .from('temp_admins')
        .update({ last_used: now.toISOString() })
        .eq('id', tempAdminId);

      return {
        isValid: true,
        tempAdmin: {
          id: tempAdmin.id,
          email: tempAdmin.email,
          expiresAt: new Date(tempAdmin.expires_at),
          permissions: tempAdmin.permissions,
          createdBy: tempAdmin.created_by,
          reason: tempAdmin.reason,
          isActive: tempAdmin.is_active,
          createdAt: new Date(tempAdmin.created_at),
          lastUsed: now,
        },
      };
    } catch (error) {
      console.error('Error validating temp admin:', error);
      return { isValid: false, error: 'Internal server error' };
    }
  }

  /**
   * List all temporary admins
   */
  async listTempAdmins(includeInactive = false): Promise<{
    success: boolean;
    tempAdmins?: TempAdminRecord[];
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('temp_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: tempAdmins, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        tempAdmins: tempAdmins.map(ta => ({
          id: ta.id,
          email: ta.email,
          expiresAt: new Date(ta.expires_at),
          permissions: ta.permissions,
          createdBy: ta.created_by,
          reason: ta.reason,
          isActive: ta.is_active,
          createdAt: new Date(ta.created_at),
          lastUsed: ta.last_used ? new Date(ta.last_used) : undefined,
          revokedAt: ta.revoked_at ? new Date(ta.revoked_at) : undefined,
          revokedBy: ta.revoked_by,
        })),
      };
    } catch (error) {
      console.error('Error listing temp admins:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Clean up expired temporary admins
   */
  async cleanupExpiredTempAdmins(): Promise<{
    success: boolean;
    cleanedCount?: number;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      // Find expired temp admins
      const { data: expiredTempAdmins, error: selectError } = await supabase
        .from('temp_admins')
        .select('id')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());

      if (selectError) {
        return { success: false, error: selectError.message };
      }

      if (!expiredTempAdmins || expiredTempAdmins.length === 0) {
        return { success: true, cleanedCount: 0 };
      }

      // Revoke each expired temp admin
      const revokePromises = expiredTempAdmins.map(ta =>
        this.revokeTempAdmin(ta.id, 'SYSTEM', 'Expired - Auto cleanup')
      );

      await Promise.all(revokePromises);

      return { success: true, cleanedCount: expiredTempAdmins.length };
    } catch (error) {
      console.error('Error cleaning up expired temp admins:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Log audit events
   */
  private async logAuditEvent(event: {
    action: string;
    tempAdminId: string;
    performedBy: string;
    details?: any;
  }): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase
        .from('temp_admin_audit_log')
        .insert({
          action: event.action,
          temp_admin_id: event.tempAdminId,
          performed_by: event.performedBy,
          details: event.details,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}