import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { profileSchema, type ProfileInput } from "@/schemas";
import { updateUserProfile, uploadUserProfilePhoto } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ProfileView: React.FC = () => {
  const { firebaseUser, userProfile, organization, membership, refreshUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile?.photoURL || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || "",
      phone: userProfile?.phone || "",
      photoURL: userProfile?.photoURL || "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    if (!firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let uploadedPhotoUrl = userProfile?.photoURL;
      if (photoFile) {
        uploadedPhotoUrl = await uploadUserProfilePhoto(firebaseUser.uid, photoFile);
      }

      await updateUserProfile(firebaseUser.uid, {
        displayName: data.displayName,
        phone: data.phone || null,
        photoURL: uploadedPhotoUrl,
      });

      await refreshUserData();
      setSuccessMsg("Profile updated successfully!");
    } catch (err: any) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My Profile</h1>
        <p className="text-xs text-muted-foreground">
          View your administrative credentials, assigned role, and personal contact info.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/10 p-3.5 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Profile Edit Form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Personal Information
            </h2>

            {/* Avatar Upload */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary border border-border overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <User className="size-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatarInput")?.click()}
                  className="rounded-xl text-xs"
                >
                  <Upload className="size-3.5 mr-1.5" /> Upload Photo
                </Button>
                <p className="mt-1 text-[10px] text-muted-foreground">JPG, PNG up to 2MB</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="displayName" className="text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="displayName"
                {...register("displayName")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {errors.displayName && (
                <p className="text-[11px] text-destructive">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address (Read-only)
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  value={userProfile?.email || ""}
                  disabled
                  className="rounded-xl border-border bg-secondary/50 text-xs pl-9 cursor-not-allowed opacity-75"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Phone Number
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                  className="rounded-xl border-border bg-surface text-xs pl-9"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* System & Membership Metadata */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
              Access & Organization
            </h3>
            
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" /> Role
              </span>
              <span className="font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {membership?.role || "OWNER"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="size-3.5 text-primary" /> School
              </span>
              <span className="font-bold text-foreground truncate max-w-[150px]">
                {organization?.name || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5 text-primary" /> Status
              </span>
              <span className="font-semibold text-success capitalize">
                {userProfile?.status || "Active"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5 text-primary" /> User ID
              </span>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                {firebaseUser?.uid}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
