import { Music2, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { user } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="sticky top-0 z-40 bg-[#2C2A27] backdrop-blur-md border-b border-[#3D3A35]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9FAC9D] to-[#89999A] flex items-center justify-center shadow-sm">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none tracking-tight">
              دوزان
            </h1>
            <p className="text-xs text-[#9FAC9D] font-medium mt-0.5">
              منصة إنتاج وإدارة المشاريع الموسيقية
            </p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2 bg-[#3D3A35] rounded-xl px-3 py-2 border border-[#5A5447]">
            <div className="w-6 h-6 rounded-lg bg-[#9FAC9D]/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-[#9FAC9D]" />
            </div>
            <span className="text-xs font-semibold text-white/80 hidden sm:block max-w-[140px] truncate">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9FAC9D]/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 mr-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
