/**
 * stores/ui-store.ts
 *
 * Global UI state — sidebar, mobile menu, modals, loading overlays.
 * NOT persisted — resets on every page load (it's pure visual state).
 *
 * Keeps UI state out of individual components so deeply nested children
 * can toggle the sidebar without prop drilling through 4 layout levels.
 */

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UIState {
  // ── Sidebar (student layout desktop) ────────────────────────────────────
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // ── Mobile bottom nav / drawer (student layout mobile) ──────────────────
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;

  // ── Exam palette drawer (mobile exam room) ───────────────────────────────
  // On mobile, the question palette lives in a bottom sheet
  isPaletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  // ── Full-page loading overlay ────────────────────────────────────────────
  // Used when submitting exam (blocking action — user must not navigate away)
  isLoadingOverlay: boolean;
  loadingMessage: string;
  showLoadingOverlay: (message?: string) => void;
  hideLoadingOverlay: () => void;

  // ── Global search (future feature) ──────────────────────────────────────
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // ── Close all drawers/overlays at once ──────────────────────────────────
  // Call this on route change to reset modal state
  closeAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState>()((set) => ({
  // ── Sidebar ──────────────────────────────────────────────────────────────
  isSidebarOpen: true, // Default open on desktop
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // ── Mobile menu ──────────────────────────────────────────────────────────
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // ── Question palette (exam room mobile) ──────────────────────────────────
  isPaletteOpen: false,
  openPalette: () => set({ isPaletteOpen: true }),
  closePalette: () => set({ isPaletteOpen: false }),
  togglePalette: () =>
    set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),

  // ── Loading overlay ──────────────────────────────────────────────────────
  isLoadingOverlay: false,
  loadingMessage: "Please wait...",
  showLoadingOverlay: (message = "Please wait...") =>
    set({ isLoadingOverlay: true, loadingMessage: message }),
  hideLoadingOverlay: () =>
    set({ isLoadingOverlay: false, loadingMessage: "Please wait..." }),

  // ── Search ───────────────────────────────────────────────────────────────
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  // ── Close all ────────────────────────────────────────────────────────────
  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isPaletteOpen: false,
      isSearchOpen: false,
      // Keep sidebar state — it's a layout preference, not a modal
    }),
}));
