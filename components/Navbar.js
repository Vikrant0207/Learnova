"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Activity, Menu, X, User, Settings, Sparkles, Search, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  NAVIGATION_ITEMS,
  getDashboardLink,
  isRouteActive,
  isDashboardRoute,
} from "@/lib/navigation";
import NavLink from "@/components/navigation/NavLink";
import NavbarBrand from "@/components/navigation/NavbarBrand";
import Sidebar from "@/components/navigation/Sidebar";
import MobileNavDrawer from "@/components/navigation/MobileNavDrawer";
import NotificationPanel from "@/components/navigation/NotificationPanel";
import UserMenu from "@/components/navigation/UserMenu";
import {
  getNavbarGlassStyle,
  gradientBorderTop,
  iconBtnClass,
  navCapsuleClass,
} from "@/components/navigation/glassStyles";
import { useTheme } from "next-themes";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, userProfile, signOut, isAuthenticated, loading } =
    useAuthContext();

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const isDark = (mounted ? resolvedTheme : null) === "dark";
  const onDashboard = isDashboardRoute(pathname);

  const switchLanguage = (lang) => {
    document.cookie = `locale=${lang}; path=/; max-age=31536000`;
    window.location.reload();
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false);
    }
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setIsNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsNotificationOpen(false);
        setIsMenuOpen(false);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!onDashboard) {
      document.body.classList.toggle("overflow-hidden", isMenuOpen);
      return () => document.body.classList.remove("overflow-hidden");
    }
  }, [isMenuOpen, onDashboard]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMenuOpen(false);
      }
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    setMobileSidebarOpen(false);
    await signOut();
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (userProfile?.fullName) return userProfile.fullName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserPhoto = () => user?.photoURL || null;

  const getUserRole = () => {
    if (!userProfile?.role) return "User";
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  const dashboardLink = getDashboardLink(userProfile?.role);

  const userMenuItems = [
    { href: "/profile", icon: User, label: "Profile", key: "profile" },
    {
      href: dashboardLink,
      icon: Activity,
      label: "Dashboard",
      key: "dashboard",
    },
    { href: "/settings", icon: Settings, label: "Settings", key: "settings" },
  ].filter((item) => !(item.key === "dashboard" && item.href === "/profile"));

  const handleImageError = (e) => {
    const img = e.target;
    const fallback = img.parentElement?.querySelector(".fallback-avatar");
    if (img && fallback) {
      img.style.display = "none";
      fallback.style.display = "flex";
    }
  };

  const checkRouteActive = (href) => isRouteActive(pathname, href);

  const handleMobileMenuToggle = () => {
    if (onDashboard) {
      setMobileSidebarOpen((open) => !open);
      return;
    }
    setIsMenuOpen((open) => !open);
  };

  const navStyle = getNavbarGlassStyle({ isDark, scrolled });

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 z-[60] h-20 w-full bg-gradient-to-b from-[#070B14]/40 to-transparent transition-opacity duration-400 dark:from-[#070B14]/50"
        style={{ opacity: scrolled ? 0 : 1 }}
        aria-hidden="true"
      />

      <motion.nav
        className="fixed left-0 right-0 top-0 z-[70] w-full"
        style={navStyle}
        initial={{ y: -4, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-label="Main navigation"
      >
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{ background: gradientBorderTop(isDark) }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
            <NavbarBrand onNavigate={() => setIsMenuOpen(false)} />
            </div>

            <div className={navCapsuleClass}>
              {NAVIGATION_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={checkRouteActive(item.href)}
                />
              ))}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("learnova:open-search"))
                }
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200/40 px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                aria-label="Open search"
              >
                <Search className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                <span className="hidden text-xs md:inline">Search</span>
                <kbd className="hidden items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 lg:inline-flex">
                  Ctrl K
                </kbd>
              </motion.button>

              <ThemeToggle />

              <div className="flex items-center gap-1 rounded-lg border border-zinc-200/50 p-1 dark:border-white/10">
                <button
                  onClick={() => switchLanguage("en")}
                  className="rounded px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage("hi")}
                  className="rounded px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  aria-label="Switch to Hindi"
                >
                  हि
                </button>
              </div>

              {loading ? (
                <div className="h-9 w-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              ) : isAuthenticated ? (
<<<<<<< HEAD
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-200/60 dark:border-white/8">
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsNotificationOpen(!isNotificationOpen);
                        setIsDropdownOpen(false);
                      }}
                      className={iconBtn}
                      aria-label="Notifications"
                    >
                      <Bell className="h-[18px] w-[18px]" />
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-1.5 right-1.5 bg-red-500 rounded-full h-2 w-2 ring-2 ring-white dark:ring-zinc-950"
                          />
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`${dropdownPanel} w-72`}
                          style={glassPanelStyle}
                        >
                          <div className="px-4 py-3 border-b border-zinc-100/60 dark:border-white/6 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              Notifications
                            </h3>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                aria-label="Action button"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100/50 dark:divide-white/5">
                            {notifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3.5 select-none">
                                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-400 dark:text-zinc-500">
                                  <BellOff className="h-6 w-6 stroke-[1.5]" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    You're all caught up!
                                  </p>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[180px] leading-normal mx-auto">
                                    No new notifications to display.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => markAsRead(n.id)}
                                  className={`p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/4 transition-colors ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                                >
                                  <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">
                                    {n.message}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        setIsNotificationOpen(false);
                      }}
                      className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-white/6 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/8 transition-all duration-200"
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                      aria-controls="profile-menu"
                      aria-label="Toggle profile menu"
                    >
                      <div className="relative w-7 h-7 shrink-0">
                        {getUserPhoto() && (
                          <Image
                            src={getUserPhoto()}
                            alt={`${getUserDisplayName()} profile photo`}
                            width={28}
                            height={28}
                            className="rounded-full object-cover ring-2 ring-blue-500/30"
                            onError={handleImageError}
                          />
                        )}
                        <div
                          className="fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold"
                          style={{ display: getUserPhoto() ? "none" : "flex" }}
                        >
                          {getUserInitials(getUserDisplayName())}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                      </div>

                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 hidden md:inline max-w-[80px] truncate">
                        {getUserDisplayName().split(" ")[0]}
                      </span>
                      <motion.span
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                      </motion.span>
                    </motion.button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          id="profile-menu"
                          role="menu"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`${dropdownPanel} w-52 py-1.5`}
                          style={glassPanelStyle}
                        >
                          <div className="px-4 py-3 border-b border-zinc-100/60 dark:border-white/6">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {getUserRole()}
                            </p>
                          </div>
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.key}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors gap-2.5"
                            >
                              <item.icon className="h-4 w-4 text-zinc-400" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="my-1 border-t border-zinc-100/60 dark:border-white/6" />
                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/8 transition-colors gap-2.5"
                            aria-label="Action button"
                          >
                            <LogOut className="h-4 w-4" /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
=======
                <div className="flex items-center gap-2 border-l border-zinc-200/60 pl-2 dark:border-white/10">
                  <NotificationPanel
                    isOpen={isNotificationOpen}
                    onToggle={() => setIsNotificationOpen((open) => !open)}
                    onCloseOthers={() => setIsDropdownOpen(false)}
                    panelRef={notifRef}
                  />
                  <UserMenu
                    isOpen={isDropdownOpen}
                    onToggle={() => setIsDropdownOpen((open) => !open)}
                    onClose={() => setIsDropdownOpen(false)}
                    onCloseOthers={() => setIsNotificationOpen(false)}
                    dropdownRef={dropdownRef}
                    userMenuItems={userMenuItems}
                    getUserDisplayName={getUserDisplayName}
                    getUserRole={getUserRole}
                    getUserPhoto={getUserPhoto}
                    getUserInitials={getUserInitials}
                    handleLogout={handleLogout}
                    handleImageError={handleImageError}
                  />
>>>>>>> origin/master
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative"
                  >
                    <span className="absolute inset-0 rounded-xl bg-indigo-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20" />
                    <Button
                      asChild
                      size="default"
                      className="relative h-9 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500"
                    >
                      <Link href="/auth">
                        <span className="flex items-center gap-1.5">
                          Login <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative"
                  >
                    <span className="absolute inset-0 rounded-xl bg-indigo-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20" />
                    <Button
                      asChild
                      size="default"
                      className="relative h-9 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500"
                    >
                      <Link href="/auth?mode=signup">
                        <span className="flex items-center gap-1.5">
                          Sign Up <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="sm:hidden">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleMobileMenuToggle}
                className={iconBtnClass}
                aria-label={onDashboard ? "Open dashboard sidebar" : "Toggle menu"}
                aria-expanded={onDashboard ? mobileSidebarOpen : isMenuOpen}
              >
                <AnimatePresence mode="wait">
                  {(onDashboard ? mobileSidebarOpen : isMenuOpen) ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -45, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {onDashboard ? (
                        <PanelLeft className="h-6 w-6" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {onDashboard && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {!onDashboard && (
        <MobileNavDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isDark={isDark}
          navigationItems={NAVIGATION_ITEMS}
          isRouteActive={checkRouteActive}
          isAuthenticated={isAuthenticated}
          loading={loading}
          userMenuItems={userMenuItems}
          getUserDisplayName={getUserDisplayName}
          getUserRole={getUserRole}
          getUserPhoto={getUserPhoto}
          getUserInitials={getUserInitials}
          handleLogout={handleLogout}
          handleImageError={handleImageError}
        />
      )}
    </>
  );
}
