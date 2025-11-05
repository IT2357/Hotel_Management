/**
 * Profile Header Component
 * Displays user avatar, name, role, and action buttons
 */

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { Button } from "@/components/manager/ManagerButton";
import { Building2, CheckCircle2, Edit3, Download } from "lucide-react";

export const ProfileHeader = ({ profile, onEditProfile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-8 shadow-2xl border-2 border-violet-200/50 backdrop-blur-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-blue-500/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-200/40 via-blue-200/40 to-transparent rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-2xl opacity-40" />
      <div
        className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-300/30 to-transparent rounded-full blur-2xl animate-pulse"
        style={{ animationDuration: "3s" }}
      />
      
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div
              className="absolute -inset-3 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 rounded-full blur-xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute -inset-1.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur opacity-50 animate-spin"
              style={{ animationDuration: "8s" }}
            />
            <Avatar className="relative h-28 w-28 border-4 border-white shadow-2xl ring-4 ring-violet-300/50">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-2xl font-bold text-white">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-violet-900 to-purple-900 bg-clip-text text-transparent drop-shadow-sm">
                {profile.name}
              </h1>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-50 animate-pulse" />
                <CheckCircle2 className="relative h-7 w-7 text-emerald-500 drop-shadow-lg" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ManagerBadge className="border-violet-300 bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 text-violet-700 font-bold shadow-md">
                {profile.role}
              </ManagerBadge>
              <span className="text-violet-400 text-lg font-bold">•</span>
              <p className="text-gray-700 font-bold">{profile.department}</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 p-1.5 shadow-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">{profile.hotel}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onEditProfile}
            className="gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-2xl hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300 border-0 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Edit3 className="h-4 w-4 relative z-10" />
            <span className="relative z-10 font-bold">Edit Profile</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-2 border-violet-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="h-4 w-4" />
            <span className="font-bold">Export Data</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
