import { NavLink } from "react-router-dom";
import { Home, CheckSquare, Target, Repeat, GitBranch, BarChart3 } from "lucide-react";

const linkBase =
  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors";

const BottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid w-full max-w-md grid-cols-6 gap-2 px-3 py-2">
        <NavLink
          to="/m/dashboard"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <Home className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/m/tasks"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <CheckSquare className="h-5 w-5" />
          Tasks
        </NavLink>
        <NavLink
          to="/m/focus"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <Target className="h-5 w-5" />
          Focus
        </NavLink>
        <NavLink
          to="/m/routines"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <Repeat className="h-5 w-5" />
          Routines
        </NavLink>
        <NavLink
          to="/m/consequences"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <GitBranch className="h-5 w-5" />
          Conseq.
        </NavLink>
        <NavLink
          to="/m/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`
          }
        >
          <BarChart3 className="h-5 w-5" />
          Analytics
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
