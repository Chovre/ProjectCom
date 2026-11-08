import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Landmark,
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Receipt,
  Users,
  FileCheck,
  ShieldCheck,
  BookOpen,
  Scale,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CreditCard,
  ClipboardList,
} from 'lucide-react';

/**
 * Navigation items per role.
 */
const customerNav = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/accounts', label: 'My Accounts', icon: Wallet },
  { to: '/customer/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/customer/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { to: '/customer/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/customer/transactions', label: 'Transactions', icon: Receipt },
];

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/audit', label: 'Audit Logs', icon: FileCheck },
];

const auditorNav = [
  { to: '/auditor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/auditor/transactions', label: 'Transactions', icon: Receipt },
  { to: '/auditor/ledger', label: 'Ledger', icon: BookOpen },
  { to: '/auditor/audit', label: 'Audit Logs', icon: ShieldCheck },
  { to: '/auditor/reconciliation', label: 'Reconciliation', icon: Scale },
];

/**
 * Resolve the page title from the current route.
 */
function useBreadcrumbTitle(navItems) {
  const { pathname } = useLocation();
  return useMemo(() => {
    const match = navItems.find((item) => pathname.startsWith(item.to));
    return match?.label || 'Dashboard';
  }, [pathname, navItems]);
}

/**
 * Role badge component.
 */
function RoleBadge({ role }) {
  const normalized = (role || '').replace('ROLE_', '');
  const colorMap = {
    ADMIN: 'bg-red-100 text-red-700',
    AUDITOR: 'bg-amber-100 text-amber-700',
    ACCOUNT_HOLDER: 'bg-teal-100 text-teal-700',
    CUSTOMER: 'bg-teal-100 text-teal-700',
  };
  const cls = colorMap[normalized] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {normalized.replace('_', ' ')}
    </span>
  );
}

export default function DashboardLayout() {
  const { user, logout, isAdmin, isAuditor } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pick nav items for the current role
  const navItems = isAdmin ? adminNav : isAuditor ? auditorNav : customerNav;
  const pageTitle = useBreadcrumbTitle(navItems);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || user?.email || 'User';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-navy-800 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-navy-700">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-500/20 p-2 rounded-lg">
              <Landmark className="h-6 w-6 text-teal-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">LedgerLine</span>
          </div>
          <button
            className="lg:hidden text-navy-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length <= 3}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-navy-600 text-white shadow-sm'
                      : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
                {/* Active indicator */}
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-navy-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-navy-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-navy-300 hover:bg-navy-700 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="hidden sm:inline">LedgerLine</span>
              <ChevronRight className="h-3.5 w-3.5 hidden sm:inline" />
              <span className="font-semibold text-gray-900 text-base">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
              </div>
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
