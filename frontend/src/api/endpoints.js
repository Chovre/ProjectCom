const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  accounts: {
    apply: '/accounts/apply',
    my: '/accounts/my',
    getById: (id) => `/accounts/${id}`,
    getBalance: (id) => `/accounts/${id}/balance`,
    adminAll: '/admin/accounts',
    updateStatus: (id) => `/admin/accounts/${id}/status`,
  },
  transactions: {
    deposit: '/transactions/deposit',
    withdraw: '/transactions/withdraw',
    transfer: '/transactions/transfer',
    my: '/transactions/my',
    getByReference: (reference) => `/transactions/${reference}`,
    dashboard: '/transactions/dashboard',
  },
  ledger: {
    byAccount: (accountId) => `/ledger/account/${accountId}`,
    reconciliation: '/admin/ledger/reconciliation',
  },
  audit: {
    my: '/audit/my',
    admin: '/admin/audit',
    auditor: '/auditor/audit',
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    updateUserStatus: (userId) => `/admin/users/${userId}/status`,
    accounts: '/admin/accounts',
    updateAccountStatus: (accountId) => `/admin/accounts/${accountId}/status`,
    applications: '/admin/applications',
    approveApplication: (id) => `/admin/applications/${id}/approve`,
    rejectApplication: (id) => `/admin/applications/${id}/reject`,
    transactions: '/admin/transactions',
    audit: '/admin/audit',
    reconciliation: '/admin/ledger/reconciliation',
  },
  auditor: {
    dashboard: '/auditor/dashboard',
    transactions: '/auditor/transactions',
    ledger: '/auditor/ledger',
    audit: '/auditor/audit',
    reconciliation: '/auditor/reconciliation',
  },
  health: {
    check: '/health',
  },
};

export default endpoints;
