import { useAuth } from "../_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Package, ShoppingBag, Star, MessageSquare, Settings, Home, FolderTree, Layout, Import, Percent, Scale, Palette, ReceiptText, Workflow, Brush, Languages, PencilLine, SearchCheck, Network, ScrollText, ShoppingCart, Mail, RotateCcw, FileSpreadsheet, Activity, Construction, Megaphone, TrendingUp } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

type SidebarTone = "sky" | "orange" | "teal" | "violet" | "slate";

const sidebarToneClasses: Record<SidebarTone, { label: string; active: string; idle: string; activeIcon: string; idleIcon: string }> = {
  sky: {
    label: "text-[#FF8100]",
    active: "bg-[#082F49] text-[#E6F7FF] ring-1 ring-inset ring-[#3E91B6]/70",
    idle: "text-[#8CC6DE] hover:bg-[#082F49]/80 hover:text-[#E6F7FF]",
    activeIcon: "text-[#BDE8FA]",
    idleIcon: "text-[#65B4D1]",
  },
  orange: {
    label: "text-[#FF8100]",
    active: "bg-[#A84C00] text-[#FFF7D9] ring-1 ring-inset ring-[#FF9A35]/70",
    idle: "text-[#FFC16A] hover:bg-[#A84C00]/65 hover:text-[#FFF7D9]",
    activeIcon: "text-[#FFF7D9]",
    idleIcon: "text-[#F7A53E]",
  },
  teal: {
    label: "text-[#FF8100]",
    active: "bg-[#193D35] text-[#E4F0D7] ring-1 ring-inset ring-[#6FA78C]/70",
    idle: "text-[#9CCAB0] hover:bg-[#193D35]/80 hover:text-[#E4F0D7]",
    activeIcon: "text-[#C5E3C7]",
    idleIcon: "text-[#78A98E]",
  },
  violet: {
    label: "text-[#FF8100]",
    active: "bg-[#873721] text-[#FFF1DF] ring-1 ring-inset ring-[#D98263]/70",
    idle: "text-[#E29A84] hover:bg-[#873721]/80 hover:text-[#FFF1DF]",
    activeIcon: "text-[#FFC2A8]",
    idleIcon: "text-[#CE755B]",
  },
  slate: {
    label: "text-[#FF8100]",
    active: "bg-[#A62B3B] text-[#FFE6B6] ring-1 ring-inset ring-[#E96979]/70",
    idle: "text-[#F0909C] hover:bg-[#A62B3B]/75 hover:text-[#FFE6B6]",
    activeIcon: "text-[#FFE6B6]",
    idleIcon: "text-[#D85769]",
  },
};

const menuSections: Array<{ label: string; tone: SidebarTone; items: Array<{ icon: typeof LayoutDashboard; label: string; path: string }> }> = [
  {
    label: "Pilotage",
    tone: "sky",
    items: [
      { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin" },
      { icon: ReceiptText, label: "Suivi administratif", path: "/admin/suivi-administratif" },
      { icon: FileSpreadsheet, label: "Export comptable & TVA", path: "/admin/comptabilite" },
      { icon: TrendingUp, label: "Taux de conversion", path: "/admin/conversion" },
    ],
  },
  {
    label: "Catalogue",
    tone: "orange",
    items: [
      { icon: Package, label: "Produits", path: "/admin/produits" },
      { icon: FolderTree, label: "Catégories", path: "/admin/categories" },
      { icon: Brush, label: "Collections créatives", path: "/admin/creations" },
      { icon: Languages, label: "Langues & traductions", path: "/admin/traductions" },
      { icon: PencilLine, label: "Éditeur simple", path: "/admin/editeur" },
    ],
  },
  {
    label: "Préparation",
    tone: "teal",
    items: [
      { icon: Import, label: "Importer fournisseur", path: "/admin/importation" },
      { icon: Workflow, label: "Hub fournisseurs", path: "/admin/fournisseurs" },
      { icon: ShoppingBag, label: "Commandes", path: "/admin/commandes" },
      { icon: RotateCcw, label: "Retours & SAV", path: "/admin/retours" },
    ],
  },
  {
    label: "Relation & contenu",
    tone: "violet",
    items: [
      { icon: Users, label: "Utilisateurs", path: "/admin/utilisateurs" },
      { icon: Star, label: "Avis clients", path: "/admin/avis" },
      { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
      { icon: Layout, label: "Contenu", path: "/admin/contenu" },
      { icon: Palette, label: "Personnalisation", path: "/admin/personnalisation" },
      { icon: Percent, label: "Promotions", path: "/admin/promotions" },
      { icon: Megaphone, label: "Campagnes & bannières", path: "/admin/campagnes" },
      { icon: ShoppingCart, label: "Paniers abandonnés", path: "/admin/paniers-abandonnes" },
      { icon: Mail, label: "E-mails clients", path: "/admin/emails" },
    ],
  },
  {
    label: "Configuration",
    tone: "slate",
    items: [
      { icon: Activity, label: "Santé du système", path: "/admin/sante" },
      { icon: Construction, label: "Mode maintenance", path: "/admin/maintenance" },
      { icon: Network, label: "Suivi Odoo", path: "/admin/suivi-odoo" },
      { icon: ScrollText, label: "Journal d'audit", path: "/admin/audit" },
      { icon: SearchCheck, label: "SEO & indexation", path: "/admin/seo" },
      { icon: Scale, label: "Informations légales", path: "/admin/legal" },
      { icon: Settings, label: "Paramètres", path: "/admin/parametres" },
      { icon: Home, label: "Retour au site", path: "/" },
    ],
  },
];

const menuItems = menuSections.flatMap(section => section.items);

// --- RBAC: which admin paths each role may access ---
const STAFF_ROLES = ["admin", "catalog_editor", "order_operator"];
const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  catalog_editor: ["/admin/produits", "/admin/categories", "/admin/traductions"],
  order_operator: ["/admin/commandes", "/admin/retours", "/admin/utilisateurs", "/admin/avis", "/admin/messages"],
};
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  catalog_editor: "Éditeur catalogue",
  order_operator: "Opérateur commandes",
};
function isPathAllowed(role: string, path: string) {
  if (role === "admin") return true;
  if (path === "/") return true;
  return (ROLE_ALLOWED_PATHS[role] || []).includes(path);
}
function firstAllowedPath(role: string) {
  if (role === "admin") return "/admin";
  return (ROLE_ALLOWED_PATHS[role] || [])[0] || "/";
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { isLoading: loading, user } = useAuth() as any;
  const [location, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user || !STAFF_ROLES.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white rounded-2xl shadow-xl" data-testid="admin-access-gate">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-20 w-20 rounded-xl object-cover shadow"
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                {!user ? "Veuillez vous connecter pour continuer" : "Accès réservé à l’équipe MAZIGHO"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = !user ? "/login" : "/";
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-orange-500 hover:bg-orange-600"
          >
            {!user ? "Se connecter" : "Retour à l'accueil"}
          </Button>
        </div>
      </div>
    );
  }

  if (!isPathAllowed(user.role, location)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full bg-white rounded-2xl shadow-xl text-center" data-testid="admin-forbidden-gate">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-xl object-cover shadow" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Accès non autorisé</h1>
            <p className="text-sm text-muted-foreground">
              Votre rôle « {ROLE_LABELS[user.role] || user.role} » ne donne pas accès à cette page.
            </p>
          </div>
          <Button
            onClick={() => setLocation(firstAllowedPath(user.role))}
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600"
            data-testid="forbidden-redirect-btn"
          >
            Aller à mon espace autorisé
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
          <Sidebar
            collapsible="icon"
            className="border-r-0 bg-[#07364D] text-[#FFF7D9]"
            disableTransition={isResizing}
            style={{ backgroundColor: '#07364D', color: '#FFF7D9' }}
          >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label="Développer la barre latérale"
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE} Admin
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label="Réduire la barre latérale"
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {menuSections.map(section => {
              const items = section.items.filter(item => isPathAllowed((user as any)?.role || "admin", item.path));
              const tone = sidebarToneClasses[section.tone];
              if (items.length === 0) return null;
              return (
              <SidebarGroup key={section.label} className="shrink-0 px-2 py-1.5">
                <SidebarGroupLabel className={`px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] ${tone.label}`}>
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map(item => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-10 transition-all duration-150 ${isActive ? tone.active : tone.idle}`}
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? tone.activeIcon : tone.idleIcon}`} />
                            <span className={isActive ? "font-semibold" : "font-medium"}>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="mb-2 flex justify-end group-data-[collapsible=icon]:justify-center">
              <ThemeToggle className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {((user as any)?.name || (user as any)?.firstName || "U")?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {(user as any)?.name || (user as any)?.firstName || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-900">
            <span className="font-semibold">MAZIGHO · espace d’administration</span>
            <span className="text-orange-700">Pilotage en CHF</span>
          </div>
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
