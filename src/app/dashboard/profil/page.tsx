"use client";

import { useState, useRef } from "react";
import { useDashboard } from "../DashboardContext";
// supabase import removed
import ProfileView from "@/components/profil/ProfileView";

const DAFTAR_BIDANG = [
  "Teknologi",
  "Otomotif",
  "Konstruksi",
  "Kesehatan",
  "Jasa Umum", // Ditambahkan sebagai ganti agar tetap ada pilihan logis
];

function normalizeBidang(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
      } catch {
        // fallback
      }
    }
    return trimmed
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

export default function ProfilPage() {
  const { user, setUser, language } = useDashboard();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileForm, setProfileForm] = useState({
    perusahaan: "",
    email: "",
    kota: "",
    provinsi: "",
    website: "",
    tag: [] as string[],
  });

  const selectedBidang = normalizeBidang(user?.tag);

  if (!user) return null;

  const startEditingProfile = () => {
    setProfileForm({
      perusahaan: user.perusahaan || "",
      email: user.email || "",
      kota: user.kota || "",
      provinsi: user.provinsi || "",
      website: user.website || "",
      tag: selectedBidang,
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/users/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          perusahaan: profileForm.perusahaan,
          email: profileForm.email,
          kota: profileForm.kota,
          provinsi: profileForm.provinsi,
          website: profileForm.website,
          tag: profileForm.tag,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Gagal menyimpan: " + (data.error || "Kesalahan server"));
        return;
      }
      const updatedUser = {
        ...user,
        perusahaan: profileForm.perusahaan,
        email: profileForm.email,
        kota: profileForm.kota,
        provinsi: profileForm.provinsi,
        website: profileForm.website,
        tag: profileForm.tag,
      };
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert("Error: " + message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", String(user.id));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto");

      const publicUrl = data.avatar_url;

      const updatedUser = { ...user, foto_url: publicUrl, avatar_url: publicUrl };
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert("Gagal upload foto: " + message);
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleProfileTag = (b: string) => {
    setProfileForm((prev) => {
      let fresh = [...prev.tag];
      if (fresh.includes(b)) {
        fresh = fresh.filter((t) => t !== b);
      } else {
        fresh.push(b);
      }
      return { ...prev, tag: fresh };
    });
  };

  return (
    <main
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="-mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-7 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 border-b relative z-30 mb-6 sm:mb-8" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)" }}>
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block border border-transparent"
              style={{ color: "var(--accent)", backgroundColor: "var(--accent-subtle)" }}
            >
              {language === 'EN' ? 'Profile' : 'Profil'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {language === 'EN' ? 'Manage Profile' : 'Kelola Profil'}
            </h1>
            <p className="text-sm sm:text-base font-medium" style={{ color: "var(--text-secondary)" }}>
              {language === 'EN' ? 'Update your company information and preferences.' : 'Perbarui informasi dan preferensi perusahaan Anda.'}
            </p>
          </div>
        </header>
      </div>

      <div className="max-w-5xl mx-auto w-full">
        <ProfileView
          user={user}
          language={language}
          uploadingFoto={uploadingFoto}
          isEditingProfile={isEditingProfile}
          profileSaving={profileSaving}
          profileForm={profileForm}
          fileInputRef={fileInputRef}
          onFotoUpload={handleFotoUpload}
          onStartEditing={startEditingProfile}
          onCancelEditing={cancelEditingProfile}
          onSaveProfile={saveProfile}
          onFormChange={(f, v) => setProfileForm(p => ({ ...p, [f]: v }))}
          onToggleProfileTag={toggleProfileTag}
          daftarBidang={DAFTAR_BIDANG}
          selectedBidang={selectedBidang}
        />
      </div>
    </main>
  );
}
