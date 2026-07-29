import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuickStats } from "@/hooks/useQuickStats";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/useHaptic";
import { Settings, LogOut, Loader2, Lock, Circle } from "lucide-react";
import OMVDrawer from "./OMVDrawer";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { vibrate } = useHaptic();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [omvDrawerOpen, setOmvDrawerOpen] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Fetch streak from useQuickStats hook
  const { data: quickStats } = useQuickStats();
  const streak = quickStats?.streak ?? 0;
  const settingsPath = location.pathname.startsWith("/m") ? "/m/settings" : "/settings";

  // Fetch completed tasks count
  const { data: completedMissionsCount } = useQuery({
    queryKey: ["completed-missions-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      
      if (error) {
        console.error("Error fetching completed missions count:", error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch OMV balance
  const { data: omvBalance } = useQuery({
    queryKey: ["omv-balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("profiles")
        .select("omv_balance")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching OMV balance:", error);
        return 0;
      }
      return data?.omv_balance || 0;
    },
    enabled: !!user,
  });

  // Derived user details
  const fullName = user?.user_metadata?.full_name || "Explorer";
  const userInitial = (user?.user_metadata?.full_name || user?.email || "E")
    .charAt(0)
    .toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Helper to format "Explorer since Month Year"
  const getExplorerSince = (createdAt: string | undefined) => {
    if (!createdAt) return "Explorer since January 2026";
    try {
      const date = new Date(createdAt);
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `Explorer since ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return "Explorer since January 2026";
    }
  };



  // Avatar photo upload logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!user) return;

    try {
      setUploading(true);
      vibrate("light");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update user auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (err) {
      // Per instructions: wrap in try/catch, show console.error only, don't crash component
      console.error("Avatar upload failed:", err);
      toast({
        title: "Upload failed",
        description: "Could not upload image. The avatars bucket may not exist yet.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    vibrate("light");
    onClose();
    await signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  // Stats Card Configs
  const statsList = [
    {
      label: "CURRENT STREAK",
      value: streak.toString(),
      sub: "days active",
      subColor: "text-[#45A199]",
      valColor: "text-white",
      locked: false,
    },
    {
      label: "ORBITAL RANK",
      value: "—",
      sub: "global ranking",
      subColor: "text-[#999999]",
      valColor: "text-white",
      locked: false,
    },
    {
      label: "OMV",
      icon: <Circle size={10} className="text-[#E8AB30] mr-1.5 inline-block" />,
      value: (omvBalance ?? 0).toString(),
      sub: "tokens earned",
      subColor: "text-[#999999]",
      valColor: "text-[#E8AB30]",
      valFont: "sim-font-mono",
      locked: false,
      onClick: () => {
        console.log("open omv drawer");
        setOmvDrawerOpen(true);
      },
    },
    {
      label: "MISSIONS",
      value: (completedMissionsCount ?? 0).toString(),
      sub: "completed",
      subColor: "text-[#999999]",
      valColor: "text-white",
      locked: false,
    },
  ];

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: 360, opacity: 1 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ x: 360, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
            className="fixed top-0 right-0 h-screen w-[360px] bg-[#0F0F0F] border-l border-[#333333] z-50 flex flex-col focus:outline-none"
          >
            {/* SECTION 1: Profile Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #141414 0%, #0A0A0A 100%)",
              }}
              className="pt-8 px-6 pb-6 border-b border-[#1A1A1A] flex flex-col items-start"
            >
              {/* Avatar block */}
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-[72px] h-[72px] rounded-full object-cover border border-[#333333]"
                  />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center">
                    <span className="font-display font-bold text-[28px] text-white select-none">
                      {userInitial}
                    </span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#45A199] animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload trigger */}
              <label className="font-sans text-[11px] font-normal text-[#45A199] hover:text-[#45A199]/85 cursor-pointer mt-2 select-none inline-block">
                {uploading ? "Updating..." : "Change photo"}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {/* Name and Metadata */}
              <h2 className="font-display font-semibold text-[16px] text-white mt-4 leading-tight">
                {fullName}
              </h2>
              <p className="font-sans font-normal text-[13px] text-[#999999] mt-1 break-all select-all">
                {user?.email}
              </p>
              <p className="font-sans font-normal text-[11px] text-[#666666] mt-2 select-none">
                {getExplorerSince(user?.created_at)}
              </p>
            </div>

            {/* SECTION 2: Stats Grid */}
            <div className="p-5 px-6 border-b border-[#1A1A1A]">
              <div className="grid grid-cols-2 gap-3">
                {statsList.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    onClick={stat.onClick}
                    whileTap={stat.onClick ? { scale: 0.98 } : undefined}
                    className={`relative bg-[#1A1A1A] border border-[#292929] rounded-lg p-[14px] px-[16px] flex flex-col overflow-hidden ${
                      stat.onClick ? "cursor-pointer hover:border-[#444]" : ""
                    }`}
                  >
                    <span className={`sim-font-mono text-[9px] text-[#666666] tracking-[0.12em] uppercase select-none relative z-0 flex items-center`}>
                      {stat.icon && stat.icon}
                      {stat.label}
                    </span>
                    <span className={`${stat.valFont || "font-display"} font-bold text-[24px] mt-1 leading-none ${stat.valColor} relative z-0`}>
                      {stat.value}
                    </span>
                    <span className={`font-sans text-[12px] mt-1 font-normal ${stat.subColor} leading-none select-none relative z-0`}>
                      {stat.sub}
                    </span>
                    {stat.locked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/40 backdrop-blur-[4px]">
                        <Lock size={16} className="text-white/80 mb-1" />
                        <span className="font-sans text-[9px] font-medium text-white/80 tracking-widest uppercase">
                          Available soon
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>



            {/* Spacer to push links to the bottom */}
            <div className="flex-grow" />

            {/* SECTION 4: Navigation Links */}
            <div className="p-2 px-4 mb-2">
              <button
                onClick={() => {
                  vibrate("light");
                  onClose();
                  navigate(settingsPath);
                }}
                className="w-full h-11 px-2 rounded-[6px] flex items-center gap-3 hover:bg-[#1A1A1A] transition-colors duration-200 text-left focus:outline-none"
              >
                <Settings size={16} className="text-[#666666]" />
                <span className="font-sans text-[14px] font-normal text-[#E6E6E6]">
                  Settings
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full h-11 px-2 rounded-[6px] flex items-center gap-3 hover:bg-[#1A1A1A] transition-colors duration-200 text-left focus:outline-none"
              >
                <LogOut size={16} className="text-[#CF3030]" />
                <span className="font-sans text-[14px] font-normal text-[#CF3030]">
                  Sign Out
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <OMVDrawer isOpen={omvDrawerOpen} onClose={() => setOmvDrawerOpen(false)} />
    </>
  );
}
