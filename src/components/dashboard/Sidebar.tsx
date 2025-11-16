import { Home, Users, Settings, BarChart3, FileCheck, AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userInfo?: { nome: string; cognome: string; email: string } | null;
}

const menuItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "users", label: "Utenti", icon: Users },
  { id: "verification", label: "Verifiche", icon: FileCheck },
  { id: "reports", label: "Segnalazioni", icon: AlertCircle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Impostazioni", icon: Settings },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

export const Sidebar = ({ activeTab, onTabChange, userInfo }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                activeTab === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-metric-gradient-1 flex items-center justify-center">
            <span className="text-white font-semibold">
              {userInfo && userInfo.nome ? userInfo.nome.charAt(0) : "A"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {userInfo ? `${userInfo.nome} ${userInfo.cognome}`.trim() : "Admin"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {userInfo ? userInfo.email : "admin@example.com"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
