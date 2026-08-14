import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  useAdminStats,
  useAdminTickets,
  useAdminContacts,
  useAdminUsers,
  useAdminSearchUsers,
  useAdminUserDetail,
  useAdminSubscriptionStats,
  useAdminSubscriptionList,
  useAdminRecentActivity,
  useUpdateTicket,
  useUpdateContact,
  useAdminTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useClearDoneTodos,
} from "@/hooks/use-admin";
import type { AdminTicket, AdminContact, AdminTodo, ActivityItem } from "@/hooks/use-admin";
import {
  BarChart3,
  Users,
  Ticket,
  Mail,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Save,
  Globe,
  FileText,
  Link as LinkIcon,
  Plus,
  X,
  CheckSquare,
  Square,
  ListTodo,
  Trash2,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

// ── Shared UI ──────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  onClick,
}: {
  label: string;
  value: number | string;
  sub?: string;
  onClick?: () => void;
}) => (
  <GlassPanel
    className={`p-5 ${onClick ? "cursor-pointer hover:bg-white/[0.02] transition-colors" : ""}`}
    onClick={onClick}
  >
    <p className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3 mb-2">
      {label}
    </p>
    <p className="font-mono text-3xl text-t1">{value}</p>
    {sub && <p className="text-xs text-t4 mt-1">{sub}</p>}
  </GlassPanel>
);

const TH = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <th className={`text-left text-[12px] font-medium uppercase tracking-[1.5px] text-t3 px-3 py-3 ${className}`}>
    {children}
  </th>
);

const categoryColors: Record<string, string> = {
  bug: "bg-red-500/[0.06] border-red-500/[0.15] text-sf-crimson",
  feature: "bg-blue-400/[0.06] border-blue-400/[0.15] text-blue-400",
  billing: "bg-amber-500/[0.06] border-amber-500/[0.15] text-sf-amber",
  account: "bg-sky-500/[0.06] border-sky-500/[0.15] text-sky-400",
  other: "bg-white/[0.04] border-white/[0.1] text-t3",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/[0.06] border-red-500/[0.15] text-sf-crimson animate-pulse",
  high: "bg-amber-500/[0.06] border-amber-500/[0.15] text-sf-amber",
  normal: "bg-white/[0.04] border-white/[0.1] text-t3",
  low: "bg-white/[0.02] border-white/[0.06] text-t4",
};

const ticketStatusColors: Record<string, string> = {
  open: "bg-primary/[0.06] border-primary/[0.15] text-primary",
  in_progress: "bg-amber-500/[0.06] border-amber-500/[0.15] text-sf-amber",
  waiting: "bg-sky-500/[0.06] border-sky-500/[0.15] text-sky-400",
  resolved: "bg-emerald-500/[0.06] border-emerald-500/[0.15] text-sf-emerald",
  closed: "bg-white/[0.02] border-white/[0.06] text-t4",
};

const contactStatusColors: Record<string, string> = {
  new: "bg-primary/[0.06] border-primary/[0.15] text-primary",
  read: "bg-sky-500/[0.06] border-sky-500/[0.15] text-sky-400",
  responded: "bg-emerald-500/[0.06] border-emerald-500/[0.15] text-sf-emerald",
  archived: "bg-white/[0.02] border-white/[0.06] text-t4",
};

const subStatusColors: Record<string, string> = {
  active: "bg-primary/[0.06] border-primary/[0.15] text-primary",
  canceled: "bg-white/[0.02] border-white/[0.06] text-t4",
  past_due: "bg-red-500/[0.06] border-red-500/[0.15] text-sf-crimson",
  trialing: "bg-sky-500/[0.06] border-sky-500/[0.15] text-sky-400",
};

const StatusBadge = ({ status, colorMap }: { status: string; colorMap: Record<string, string> }) => (
  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[12px] font-medium uppercase tracking-wider ${colorMap[status] ?? "text-t3"}`}>
    {status.replace(/_/g, " ")}
  </span>
);

const FilterBar = ({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    <Button
      variant={!value ? "default" : "ghost"}
      size="sm"
      className="rounded-none text-xs"
      onClick={() => onChange(undefined)}
    >
      All
    </Button>
    {options.map((s) => (
      <Button
        key={s}
        variant={value === s ? "default" : "ghost"}
        size="sm"
        className="rounded-none text-xs"
        onClick={() => onChange(s)}
      >
        {s.replace(/_/g, " ")}
      </Button>
    ))}
  </div>
);

// ── Tasks Sidebar ─────────────────────────────────────────────

const priorityDotColors: Record<string, string> = {
  urgent: "bg-red-400 animate-pulse",
  high: "bg-amber-500",
  normal: "",
  low: "bg-white/10",
};

const TaskItem = ({
  todo,
  onNavigate,
}: {
  todo: AdminTodo;
  onNavigate: (tab: string) => void;
}) => {
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const isDone = todo.status === "done";

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo.mutate({
      todoId: todo.id,
      status: isDone ? "pending" : "done",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo.mutate(todo.id);
  };

  const handleClick = () => {
    if (todo.linked_ticket_id) onNavigate("tickets");
    else if (todo.linked_contact_id) onNavigate("contacts");
  };

  const isLinked = todo.linked_ticket_id || todo.linked_contact_id;
  const dotColor = priorityDotColors[todo.priority];

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors ${isLinked ? "cursor-pointer" : ""} ${isDone ? "opacity-50" : ""}`}
      onClick={isLinked ? handleClick : undefined}
    >
      <button
        onClick={toggleDone}
        className="shrink-0 text-t3 hover:text-primary transition-colors"
      >
        {isDone ? (
          <CheckSquare className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
      </button>

      {dotColor && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}

      <span className={`text-xs truncate flex-1 ${isDone ? "line-through text-t4" : "text-t2"}`}>
        {todo.title}
      </span>

      {todo.linked_ticket_id && (
        <span className="shrink-0 text-[12px] font-medium uppercase tracking-wider px-1 py-0.5 rounded-sm bg-amber-500/[0.06] border border-amber-500/[0.15] text-sf-amber">
          TKT
        </span>
      )}
      {todo.linked_contact_id && (
        <span className="shrink-0 text-[12px] font-medium uppercase tracking-wider px-1 py-0.5 rounded-sm bg-sky-500/[0.06] border border-sky-500/[0.15] text-sky-400">
          MSG
        </span>
      )}

      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-t4 hover:text-sf-crimson transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const TasksSidebarContent = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { data: todos, isLoading } = useAdminTodos();
  const createTodo = useCreateTodo();
  const clearDone = useClearDoneTodos();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingTodos = todos?.filter((t) => t.status !== "done") ?? [];
  const doneTodos = todos?.filter((t) => t.status === "done") ?? [];

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await createTodo.mutateAsync({ title: newTitle.trim(), priority: newPriority });
    setNewTitle("");
    setNewPriority("normal");
    setShowAdd(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setShowAdd(false); setNewTitle(""); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h3 className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
            Tasks
          </h3>
          {pendingTodos.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-[12px] font-mono bg-primary/[0.06] border border-primary/[0.15] text-primary">
              {pendingTodos.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-none"
          title="Add task"
          onClick={() => {
            setShowAdd(!showAdd);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <div className="px-3 py-2 border-b border-white/[0.06] space-y-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xs text-xs text-t2 placeholder:text-t4 px-2 py-1.5 focus:border-primary/35 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              title="Priority"
              className="bg-white/[0.04] border border-white/[0.1] rounded-xs text-[12px] text-t3 px-1.5 py-1 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <Button
              size="sm"
              className="rounded-none text-[12px] h-6 px-2"
              onClick={handleAdd}
              disabled={!newTitle.trim() || createTodo.isPending}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader size="sm" /></div>
        ) : pendingTodos.length === 0 && doneTodos.length === 0 ? (
          <p className="text-center text-t4 text-xs py-8">No tasks yet</p>
        ) : (
          <>
            {/* Active tasks */}
            <div className="divide-y divide-white/[0.03]">
              {pendingTodos.map((t) => (
                <TaskItem key={t.id} todo={t} onNavigate={onNavigate} />
              ))}
            </div>

            {/* Done tasks */}
            {doneTodos.length > 0 && (
              <div className="border-t border-white/[0.06]">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium uppercase tracking-wider text-t4 hover:text-t3 transition-colors"
                  onClick={() => setShowDone(!showDone)}
                >
                  <span className="flex items-center gap-1.5">
                    {showDone ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Done ({doneTodos.length})
                  </span>
                </button>
                {showDone && (
                  <>
                    <div className="divide-y divide-white/[0.03]">
                      {doneTodos.map((t) => (
                        <TaskItem key={t.id} todo={t} onNavigate={onNavigate} />
                      ))}
                    </div>
                    <div className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-[12px] h-6 gap-1 text-t4 hover:text-sf-crimson"
                        onClick={() => clearDone.mutate()}
                        disabled={clearDone.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear done
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Overview Tab ───────────────────────────────────────────────

const OverviewTab = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  const { data: stats, isLoading } = useAdminStats();
  const { data: activity, isLoading: activityLoading } = useAdminRecentActivity();

  if (isLoading || !stats) {
    return <div className="flex justify-center py-16"><Loader /></div>;
  }

  const activityIcon = (type: string) => {
    switch (type) {
      case "ticket": return <Ticket className="w-3.5 h-3.5 text-sf-amber" />;
      case "contact": return <MessageSquare className="w-3.5 h-3.5 text-sky-400" />;
      case "signup": return <UserPlus className="w-3.5 h-3.5 text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={stats.total_users}
          sub={`+${stats.users_last_7d} (7d) / +${stats.users_last_30d} (30d)`}
          onClick={() => onTabChange("users")}
        />
        <StatCard label="Active Worlds" value={stats.total_worlds} />
        <StatCard label="Active Worksheets" value={stats.total_worksheets} />
        <StatCard
          label="Active Subscriptions"
          value={stats.active_subscriptions}
          onClick={() => onTabChange("subscriptions")}
        />
        <StatCard
          label="Open Tickets"
          value={stats.open_tickets}
          onClick={() => onTabChange("tickets")}
        />
        <StatCard
          label="Unread Contacts"
          value={stats.unread_contacts}
          onClick={() => onTabChange("contacts")}
        />
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-emerald mb-4">
          Recent Activity
        </h2>
        <GlassPanel className="divide-y divide-white/[0.04]">
          {activityLoading ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : !activity?.length ? (
            <p className="text-center text-t4 py-8">No recent activity</p>
          ) : (
            activity.map((item: ActivityItem, i: number) => (
              <div
                key={`${item.type}-${i}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => {
                  if (item.type === "ticket") onTabChange("tickets");
                  else if (item.type === "contact") onTabChange("contacts");
                  else onTabChange("users");
                }}
              >
                {activityIcon(item.type)}
                <StatusBadge
                  status={item.type}
                  colorMap={{
                    ticket: "bg-amber-500/[0.06] border-amber-500/[0.15] text-sf-amber",
                    contact: "bg-sky-500/[0.06] border-sky-500/[0.15] text-sky-400",
                    signup: "bg-primary/[0.06] border-primary/[0.15] text-primary",
                  }}
                />
                <span className="text-sm text-t2 truncate flex-1">{item.title}</span>
                {item.metadata && (
                  <span className="text-xs text-t4 hidden sm:inline">{item.metadata}</span>
                )}
                <span className="text-xs text-t4 shrink-0">{timeAgo(item.created_at)}</span>
              </div>
            ))
          )}
        </GlassPanel>
      </div>
    </div>
  );
};

// ── Users Tab ──────────────────────────────────────────────────

const UsersTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: allUsers, isLoading } = useAdminUsers();
  const { data: searchResults, isLoading: searching } = useAdminSearchUsers(searchQuery);
  const { data: userDetail } = useAdminUserDetail(expandedId);

  const users = searchQuery.length >= 2 ? searchResults : allUsers;
  const loading = searchQuery.length >= 2 ? searching : isLoading;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xs text-sm text-t2 placeholder:text-t4 focus:border-primary/35 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <TH className="w-8 px-2" />
                <TH>Display Name</TH>
                <TH>Email</TH>
                <TH>Joined</TH>
                <TH className="text-center">Worlds</TH>
                <TH className="text-center">Worksheets</TH>
                <TH>Subscription</TH>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => {
                const isExpanded = expandedId === u.id;
                return (
                  <>
                    <tr
                      key={u.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    >
                      <td className="px-2 py-3 text-t4">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-3 py-3 text-t2">
                        {u.display_name || <span className="text-t4 italic">No name</span>}
                      </td>
                      <td className="px-3 py-3 text-t3 text-xs">{u.email || "-"}</td>
                      <td className="px-3 py-3 text-t4 font-mono text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-3 py-3 text-center font-mono text-t2">{u.world_count}</td>
                      <td className="px-3 py-3 text-center font-mono text-t2">{u.worksheet_count}</td>
                      <td className="px-3 py-3">
                        {u.subscription_status ? (
                          <StatusBadge status={u.subscription_status} colorMap={subStatusColors} />
                        ) : (
                          <span className="text-t4 text-xs">Free</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && userDetail && (
                      <tr key={`${u.id}-detail`} className="border-b border-white/[0.04]">
                        <td colSpan={7} className="px-6 py-5 bg-white/[0.01]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Profile */}
                            <div className="space-y-3">
                              <h4 className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">Profile</h4>
                              <div className="space-y-1.5 text-sm">
                                <div><span className="text-t4">Email:</span> <span className="text-t2">{userDetail.email}</span></div>
                                <div><span className="text-t4">Display Name:</span> <span className="text-t2">{userDetail.display_name || "-"}</span></div>
                                {userDetail.bio && <div><span className="text-t4">Bio:</span> <span className="text-t3 text-xs">{userDetail.bio}</span></div>}
                                <div><span className="text-t4">Joined:</span> <span className="text-t2 font-mono text-xs">{formatDate(userDetail.created_at)}</span></div>
                              </div>

                              <h4 className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3 pt-2">Usage</h4>
                              <div className="flex gap-6 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-t4" />
                                  <span className="font-mono text-t2">{userDetail.world_count}</span>
                                  <span className="text-t4">worlds</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-t4" />
                                  <span className="font-mono text-t2">{userDetail.worksheet_count}</span>
                                  <span className="text-t4">worksheets</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <LinkIcon className="w-3.5 h-3.5 text-t4" />
                                  <span className="font-mono text-t2">{userDetail.collaborator_count}</span>
                                  <span className="text-t4">collabs</span>
                                </div>
                              </div>
                              {userDetail.notion_connected && (
                                <div className="text-xs text-t3">Notion connected</div>
                              )}
                            </div>

                            {/* Right: Subscription */}
                            <div className="space-y-3">
                              <h4 className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">Subscription</h4>
                              {userDetail.subscription ? (
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={userDetail.subscription.status} colorMap={subStatusColors} />
                                    <span className="text-t3 text-xs">{userDetail.subscription.plan_type}</span>
                                  </div>
                                  {userDetail.subscription.current_period_end && (
                                    <div><span className="text-t4">Period ends:</span> <span className="text-t2 font-mono text-xs">{formatDate(userDetail.subscription.current_period_end)}</span></div>
                                  )}
                                  {userDetail.subscription.cancel_at_period_end && (
                                    <div className="text-xs text-sf-crimson">Canceling at period end</div>
                                  )}
                                  {userDetail.subscription.canceled_at && (
                                    <div><span className="text-t4">Canceled:</span> <span className="text-t2 font-mono text-xs">{formatDate(userDetail.subscription.canceled_at)}</span></div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-t4 text-sm">No subscription</p>
                              )}
                              {userDetail.stripe_customer_id && (
                                <a
                                  href={`https://dashboard.stripe.com/customers/${userDetail.stripe_customer_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-t3 hover:text-primary transition-colors mt-2"
                                >
                                  Open in Stripe <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-t4">
                    {searchQuery.length >= 2 ? "No users match your search" : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
};

// ── Tickets Tab ────────────────────────────────────────────────

const TICKET_STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
const TICKET_PRIORITIES = ["urgent", "high", "normal", "low"] as const;
const TICKET_CATEGORIES = ["bug", "feature", "billing", "account", "other"] as const;

const TicketDetail = ({ ticket }: { ticket: AdminTicket }) => {
  const [notes, setNotes] = useState(ticket.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const updateTicket = useUpdateTicket();
  const notesChanged = notes !== (ticket.admin_notes || "");

  const handleSaveNotes = async () => {
    setSaving(true);
    await updateTicket.mutateAsync({ ticketId: ticket.id, adminNotes: notes });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-t3">
        <span><span className="text-t4">From:</span> {ticket.name}</span>
        <span><span className="text-t4">Email:</span> {ticket.email}</span>
        <span><span className="text-t4">Submitted:</span> {formatDate(ticket.created_at)}</span>
      </div>

      <p className="text-sm text-t2 whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-3 rounded-xs border border-white/[0.04]">
        {ticket.message}
      </p>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t4 w-16">Status:</span>
        {TICKET_STATUSES.map((s) => (
          <Button
            key={s}
            variant={ticket.status === s ? "default" : "ghost"}
            size="sm"
            className="rounded-none text-[12px] h-7 px-2"
            disabled={updateTicket.isPending}
            onClick={(e) => { e.stopPropagation(); updateTicket.mutate({ ticketId: ticket.id, status: s }); }}
          >
            {s.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {/* Priority */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t4 w-16">Priority:</span>
        {TICKET_PRIORITIES.map((p) => (
          <Button
            key={p}
            variant={ticket.priority === p ? "default" : "ghost"}
            size="sm"
            className="rounded-none text-[12px] h-7 px-2"
            disabled={updateTicket.isPending}
            onClick={(e) => { e.stopPropagation(); updateTicket.mutate({ ticketId: ticket.id, priority: p }); }}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Admin Notes */}
      <div className="space-y-2">
        <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t4">Admin Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes..."
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xs text-sm text-t2 placeholder:text-t4 p-3 focus:border-primary/35 focus:outline-none resize-none"
          onClick={(e) => e.stopPropagation()}
        />
        {notesChanged && (
          <Button
            size="sm"
            className="rounded-none text-xs gap-1.5"
            onClick={(e) => { e.stopPropagation(); handleSaveNotes(); }}
            disabled={saving}
          >
            <Save className="w-3 h-3" />
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        )}
      </div>
    </div>
  );
};

const TicketsTab = () => {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: tickets, isLoading } = useAdminTickets(filterStatus, filterCategory);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterBar options={TICKET_STATUSES} value={filterStatus} onChange={setFilterStatus} />
        <FilterBar options={TICKET_CATEGORIES} value={filterCategory} onChange={setFilterCategory} />
      </div>

      <GlassPanel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <TH className="w-8 px-2" />
              <TH>Ticket #</TH>
              <TH>Subject</TH>
              <TH>Category</TH>
              <TH>Priority</TH>
              <TH>Status</TH>
              <TH>Submitted</TH>
            </tr>
          </thead>
          <tbody>
            {tickets?.map((t) => {
              const isExpanded = expandedId === t.id;
              const hasNotes = !!(t.admin_notes && t.admin_notes.trim());
              return (
                <>
                  <tr
                    key={t.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  >
                    <td className="px-2 py-3 text-t4">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-t2">
                      {t.ticket_number}
                      {hasNotes && <span className="ml-1.5 text-sf-amber" title="Has admin notes">*</span>}
                    </td>
                    <td className="px-3 py-3 text-t2 max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-3 py-3"><StatusBadge status={t.category} colorMap={categoryColors} /></td>
                    <td className="px-3 py-3"><StatusBadge status={t.priority} colorMap={priorityColors} /></td>
                    <td className="px-3 py-3"><StatusBadge status={t.status} colorMap={ticketStatusColors} /></td>
                    <td className="px-3 py-3 text-t4 text-xs">{timeAgo(t.created_at)}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${t.id}-detail`} className="border-b border-white/[0.04]">
                      <td colSpan={7} className="px-6 py-4 bg-white/[0.01]">
                        <TicketDetail ticket={t} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {(!tickets || tickets.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-t4">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
};

// ── Contacts Tab ───────────────────────────────────────────────

const CONTACT_STATUSES = ["new", "read", "responded", "archived"] as const;

const ContactDetail = ({ contact }: { contact: AdminContact }) => {
  const [notes, setNotes] = useState(contact.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const updateContact = useUpdateContact();
  const notesChanged = notes !== (contact.admin_notes || "");

  const handleSaveNotes = async () => {
    setSaving(true);
    await updateContact.mutateAsync({ contactId: contact.id, adminNotes: notes });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-t3">
        <span><span className="text-t4">From:</span> {contact.name}</span>
        <span><span className="text-t4">Email:</span> {contact.email}</span>
        <span><span className="text-t4">Received:</span> {formatDate(contact.created_at)}</span>
      </div>

      <p className="text-sm text-t2 whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-3 rounded-xs border border-white/[0.04]">
        {contact.message}
      </p>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t4 w-16">Status:</span>
        {CONTACT_STATUSES.map((s) => (
          <Button
            key={s}
            variant={contact.status === s ? "default" : "ghost"}
            size="sm"
            className="rounded-none text-[12px] h-7 px-2"
            disabled={updateContact.isPending}
            onClick={(e) => { e.stopPropagation(); updateContact.mutate({ contactId: contact.id, status: s }); }}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Admin Notes */}
      <div className="space-y-2">
        <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t4">Admin Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes..."
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xs text-sm text-t2 placeholder:text-t4 p-3 focus:border-primary/35 focus:outline-none resize-none"
          onClick={(e) => e.stopPropagation()}
        />
        {notesChanged && (
          <Button
            size="sm"
            className="rounded-none text-xs gap-1.5"
            onClick={(e) => { e.stopPropagation(); handleSaveNotes(); }}
            disabled={saving}
          >
            <Save className="w-3 h-3" />
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        )}
      </div>
    </div>
  );
};

const ContactsTab = () => {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: contacts, isLoading } = useAdminContacts(filterStatus);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader /></div>;
  }

  return (
    <div className="space-y-4">
      <FilterBar options={CONTACT_STATUSES} value={filterStatus} onChange={setFilterStatus} />

      <GlassPanel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <TH className="w-8 px-2" />
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Message</TH>
              <TH>Status</TH>
              <TH>Received</TH>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((c) => {
              const isExpanded = expandedId === c.id;
              const hasNotes = !!(c.admin_notes && c.admin_notes.trim());
              return (
                <>
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <td className="px-2 py-3 text-t4">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-3 text-t2">
                      {c.name}
                      {hasNotes && <span className="ml-1.5 text-sf-amber" title="Has admin notes">*</span>}
                    </td>
                    <td className="px-3 py-3 text-t3 text-xs">{c.email}</td>
                    <td className="px-3 py-3 text-t3 max-w-[250px] truncate text-xs">{c.message}</td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} colorMap={contactStatusColors} /></td>
                    <td className="px-3 py-3 text-t4 text-xs">{timeAgo(c.created_at)}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${c.id}-detail`} className="border-b border-white/[0.04]">
                      <td colSpan={6} className="px-6 py-4 bg-white/[0.01]">
                        <ContactDetail contact={c} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {(!contacts || contacts.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-t4">No contacts found</td></tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
};

// ── Subscriptions Tab ──────────────────────────────────────────

const SUB_STATUSES = ["active", "canceled", "past_due", "trialing"] as const;

const SubscriptionsTab = () => {
  const { data: stats, isLoading: statsLoading } = useAdminSubscriptionStats();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const { data: subs, isLoading: subsLoading } = useAdminSubscriptionList(filterStatus);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      {statsLoading || !stats ? (
        <div className="flex justify-center py-8"><Loader /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Trialing" value={stats.trialing} />
          <StatCard label="Canceling at Period End" value={stats.cancel_at_period_end} />
          <StatCard label="Past Due" value={stats.past_due} />
          <StatCard label="Canceled" value={stats.canceled} />
          <StatCard label="Total Ever" value={stats.total_ever} />
        </div>
      )}

      {/* Individual Subscriptions */}
      <div>
        <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-emerald mb-4">
          Individual Subscriptions
        </h2>
        <div className="space-y-4">
          <FilterBar options={SUB_STATUSES} value={filterStatus} onChange={setFilterStatus} />

          {subsLoading ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : (
            <GlassPanel className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <TH>User</TH>
                    <TH>Email</TH>
                    <TH>Plan</TH>
                    <TH>Status</TH>
                    <TH>Period End</TH>
                    <TH>Canceling?</TH>
                    <TH />
                  </tr>
                </thead>
                <tbody>
                  {subs?.map((s) => (
                    <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-3 py-3 text-t2">
                        {s.display_name || <span className="text-t4 italic">No name</span>}
                      </td>
                      <td className="px-3 py-3 text-t3 text-xs">{s.email || "-"}</td>
                      <td className="px-3 py-3 text-t2 font-mono text-xs">{s.plan_type}</td>
                      <td className="px-3 py-3"><StatusBadge status={s.status} colorMap={subStatusColors} /></td>
                      <td className="px-3 py-3 text-t4 font-mono text-xs">
                        {s.current_period_end ? formatDate(s.current_period_end) : "-"}
                      </td>
                      <td className="px-3 py-3">
                        {s.cancel_at_period_end ? (
                          <span className="text-sf-crimson text-xs">Yes</span>
                        ) : (
                          <span className="text-t4 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${s.stripe_subscription_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-t4 hover:text-primary transition-colors"
                          title="Open in Stripe"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {(!subs || subs.length === 0) && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-t4">No subscriptions found</td></tr>
                  )}
                </tbody>
              </table>
            </GlassPanel>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-t3 hover:text-primary transition-colors"
        >
          Open Stripe Dashboard
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

// ── Main Admin Page ────────────────────────────────────────────

const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AdminGuard>
      <Header />
      <main className="min-h-screen pt-20 pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl md:text-4xl tracking-[0.08em] text-t1">
              MISSION CONTROL
            </h1>
            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[12px] font-medium uppercase tracking-wider bg-red-500/[0.06] border-red-500/[0.15] text-sf-crimson">
              <AlertTriangle className="w-3 h-3" /> Admin Only
            </span>
          </div>
          <p className="text-t4 text-xs mb-8 font-mono">
            Secured via SECURITY DEFINER RPCs. All queries verify is_admin before executing.
          </p>

          <div className="flex gap-6">
            {/* Main content area */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Sticky tab bar */}
                <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="overview" className="gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Users</span>
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tickets</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Contacts</span>
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Subs</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="mt-4">
                  <TabsContent value="overview">
                    <OverviewTab onTabChange={setActiveTab} />
                  </TabsContent>
                  <TabsContent value="users">
                    <UsersTab />
                  </TabsContent>
                  <TabsContent value="tickets">
                    <TicketsTab />
                  </TabsContent>
                  <TabsContent value="contacts">
                    <ContactsTab />
                  </TabsContent>
                  <TabsContent value="subscriptions">
                    <SubscriptionsTab />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-28">
                <GlassPanel className="h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                  <TasksSidebarContent onNavigate={setActiveTab} />
                </GlassPanel>
              </div>
            </div>
          </div>

          {/* Mobile tasks FAB + Sheet */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg" className="rounded-none h-12 w-12 p-0 shadow-lg">
                  <ListTodo className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <TasksSidebarContent onNavigate={setActiveTab} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </main>
      <Footer />
    </AdminGuard>
  );
};

export default Admin;
