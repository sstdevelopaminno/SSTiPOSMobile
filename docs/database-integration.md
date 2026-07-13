# Database Integration

Reused tables from SSTiPOS docs/types: `tenants`, `branches`, `branch_devices`, `user_branch_roles`, `pos_user_profiles`, `pos_sessions`, `orders`, `shifts`, `ingredients`, `staff_attendance_records`, `subscription_package_features`, `tenant_feature_subscriptions`, `audit_logs`.

Mobile POS sessions are created only after employee verification and cashier device selection. `pos_sessions.device_id` and `pos_sessions.device_code` are set from the server-validated `branch_devices` row. Shift checks use the selected `device_code` so each cashier device must open its own shift before the dashboard becomes available.

No schema change was applied. Any mobile-specific tables must be reviewed first.
