# Temporary Admin System Documentation

## Overview

The Temporary Admin System provides a secure way to grant temporary administrative access to users for specific periods and purposes. This system includes comprehensive audit logging, automatic expiration, and manual revocation capabilities.

## Features

### Core Functionality
- **Secure Account Creation**: Creates temporary admin accounts with either generated or custom passwords
- **Time-based Expiration**: Automatically expires accounts after a specified date/time
- **Permission Management**: Configurable permissions for different access levels
- **Manual Revocation**: Ability to immediately revoke access before expiration
- **Audit Logging**: Complete audit trail of all temporary admin activities
- **Automatic Cleanup**: Scheduled cleanup of expired accounts

### Security Features
- **Strong Password Generation**: Automatically generates secure passwords with mixed character sets
- **Access Validation**: Real-time validation of temporary admin status
- **Role-based Access Control**: Only main admins can manage temporary admins
- **Session Management**: Automatic logout for expired or revoked accounts
- **Audit Trail**: Comprehensive logging of all actions

## Database Schema

### temp_admins Table
```sql
- id (uuid, primary key, references auth.users)
- email (text, unique)
- expires_at (timestamptz)
- permissions (text array)
- created_by (uuid, references auth.users)
- reason (text)
- is_active (boolean)
- last_used (timestamptz)
- revoked_at (timestamptz)
- revoked_by (uuid, references auth.users)
- revoke_reason (text)
- created_at (timestamptz)
```

### temp_admin_audit_log Table
```sql
- id (uuid, primary key)
- action (text)
- temp_admin_id (uuid, references temp_admins)
- performed_by (uuid, references auth.users)
- details (jsonb)
- timestamp (timestamptz)
```

## API Endpoints

### POST /api/temp-admin/create
Creates a new temporary admin account.

**Request Body:**
```json
{
  "email": "temp.admin@example.com",
  "password": "optional-custom-password",
  "expiresAt": "2024-12-31T23:59:59Z",
  "permissions": ["admin"],
  "createdBy": "creator-user-id",
  "reason": "Emergency system maintenance"
}
```

**Response:**
```json
{
  "success": true,
  "tempAdmin": { /* TempAdminRecord */ },
  "password": "generated-password-if-applicable"
}
```

### POST /api/temp-admin/revoke
Revokes a temporary admin account.

**Request Body:**
```json
{
  "tempAdminId": "temp-admin-user-id",
  "revokedBy": "revoker-user-id",
  "reason": "No longer needed"
}
```

### POST /api/temp-admin/cleanup
Cleans up expired temporary admin accounts (for scheduled tasks).

**Headers:**
```
Authorization: Bearer <CLEANUP_TOKEN>
```

## Usage Examples

### Creating a Temporary Admin
```typescript
import { TempAdminManager } from '@/lib/temp-admin';

const tempAdminManager = new TempAdminManager();

const result = await tempAdminManager.createTempAdmin({
  email: 'emergency.admin@company.com',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  permissions: ['admin'],
  createdBy: 'main-admin-id',
  reason: 'Emergency system maintenance required'
});

if (result.success) {
  console.log('Temp admin created:', result.tempAdmin);
  if (result.password) {
    console.log('Generated password:', result.password);
  }
}
```

### Validating a Temporary Admin
```typescript
const validation = await tempAdminManager.validateTempAdmin(userId);

if (validation.isValid) {
  console.log('Temp admin is valid:', validation.tempAdmin);
} else {
  console.log('Temp admin is invalid:', validation.error);
}
```

### Revoking Access
```typescript
const result = await tempAdminManager.revokeTempAdmin(
  tempAdminId,
  'main-admin-id',
  'Task completed'
);

if (result.success) {
  console.log('Temp admin access revoked');
}
```

## Security Considerations

### Password Security
- Generated passwords are 16 characters long with mixed case, numbers, and symbols
- Passwords are only shown once during creation
- Custom passwords must meet minimum security requirements

### Access Control
- Only main administrators (non-temporary) can create, view, or revoke temporary admins
- Temporary admins cannot create other temporary admins
- All actions are logged with full audit trails

### Session Management
- Temporary admin sessions are validated on each request
- Expired accounts are automatically logged out
- Revoked accounts lose access immediately

### Data Protection
- All sensitive operations use Row Level Security (RLS)
- Audit logs are immutable and protected
- Personal data is handled according to privacy requirements

## Monitoring and Maintenance

### Audit Logging
All temporary admin activities are logged including:
- Account creation and deletion
- Access grants and revocations
- Login attempts and usage patterns
- Administrative actions performed

### Scheduled Cleanup
Set up a cron job to regularly clean up expired accounts:
```bash
# Run every hour
0 * * * * curl -X POST -H "Authorization: Bearer $CLEANUP_TOKEN" https://your-app.com/api/temp-admin/cleanup
```

### Monitoring Queries
```sql
-- Active temporary admins
SELECT * FROM temp_admins WHERE is_active = true;

-- Recently expired admins
SELECT * FROM temp_admins 
WHERE expires_at < now() 
AND expires_at > now() - interval '7 days';

-- Audit log for specific admin
SELECT * FROM temp_admin_audit_log 
WHERE temp_admin_id = 'specific-id' 
ORDER BY timestamp DESC;
```

## Best Practices

### Account Creation
1. Always provide a clear, specific reason for temporary access
2. Set the shortest reasonable expiration time
3. Use generated passwords when possible
4. Notify the temporary admin through secure channels

### Access Management
1. Regularly review active temporary admins
2. Revoke access immediately when no longer needed
3. Monitor audit logs for unusual activity
4. Document all temporary access grants

### Security
1. Never share temporary admin credentials
2. Use secure communication channels for password sharing
3. Regularly rotate cleanup tokens
4. Monitor for failed login attempts

## Troubleshooting

### Common Issues

**Temporary admin cannot log in:**
- Check if account has expired
- Verify account is still active
- Check for typos in email/password

**Cannot create temporary admin:**
- Verify you have main admin privileges
- Check if email is already in use
- Ensure expiration date is in the future

**Access denied errors:**
- Verify user role and temporary admin status
- Check RLS policies are correctly applied
- Review audit logs for clues

### Error Codes
- `TEMP_ADMIN_EXPIRED`: Account has passed expiration date
- `TEMP_ADMIN_REVOKED`: Account has been manually revoked
- `TEMP_ADMIN_NOT_FOUND`: Account does not exist or is inactive
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

## Environment Variables

```env
# Required for cleanup endpoint
CLEANUP_TOKEN=your-secure-cleanup-token

# Supabase configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Migration Instructions

1. Run the temporary admin migration:
   ```sql
   -- Apply the migration file: supabase/migrations/create_temp_admin_tables.sql
   ```

2. Set up environment variables:
   ```bash
   echo "CLEANUP_TOKEN=$(openssl rand -hex 32)" >> .env.local
   ```

3. Configure scheduled cleanup (optional):
   ```bash
   # Add to crontab
   0 */6 * * * curl -X POST -H "Authorization: Bearer $CLEANUP_TOKEN" https://your-app.com/api/temp-admin/cleanup
   ```

4. Test the system:
   - Create a temporary admin account
   - Verify login works
   - Test expiration and revocation
   - Check audit logs

## Support and Maintenance

For issues or questions regarding the temporary admin system:

1. Check the audit logs for detailed error information
2. Verify database connectivity and RLS policies
3. Review the middleware validation logic
4. Check environment variable configuration

The system is designed to be self-maintaining with automatic cleanup and comprehensive logging for troubleshooting.