import React, { useState } from 'react';
import {
  User,
  X,
  Camera,
  GraduationCap,
  Shield,
  UserX,
  LogOut,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser, updateUserProfile } from '../firebase/authService';
import { unblockUser } from '../firebase/moderationService';
import { AVATAR_PRESETS, DEPARTMENTS } from '../constants/spaces';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, refreshProfile, blockedUserIds } = useAuth();
  const [tab, setTab] = useState<'profile' | 'security' | 'blocked'>('profile');

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [department, setDepartment] = useState(profile?.department || 'Microbiology');
  const [level, setLevel] = useState(profile?.level || '200 Level');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || AVATAR_PRESETS[0]);
  const [customPhoto, setCustomPhoto] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const finalPhoto = customPhoto.trim() || photoURL;
      await updateUserProfile(profile.id, {
        displayName: displayName.trim(),
        department,
        level,
        bio: bio.trim(),
        photoURL: finalPhoto,
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!profile) return;
    try {
      await unblockUser(profile.id, blockedId);
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Student Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 text-xs font-bold">
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 py-2 rounded-lg transition ${
              tab === 'profile'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Details
          </button>
          <button
            onClick={() => setTab('blocked')}
            className={`flex-1 py-2 rounded-lg transition ${
              tab === 'blocked'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocked ({blockedUserIds.length})
          </button>
          <button
            onClick={() => setTab('security')}
            className={`flex-1 py-2 rounded-lg transition ${
              tab === 'security'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Account
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar section */}
              <div className="flex items-center gap-4">
                <img
                  src={customPhoto.trim() || photoURL}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500 shadow-md shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1.5">Preset Avatars</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.slice(0, 5).map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPhotoURL(preset);
                          setCustomPhoto('');
                        }}
                        className={`w-7 h-7 rounded-full overflow-hidden ring-1 transition ${
                          photoURL === preset && !customPhoto
                            ? 'ring-emerald-400 scale-110'
                            : 'ring-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="Biological Sciences General">Biological Sciences (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="100 Level">100 Level</option>
                    <option value="200 Level">200 Level</option>
                    <option value="300 Level">300 Level</option>
                    <option value="400 Level">400 Level</option>
                    <option value="Postgraduate / Alumni">Postgraduate / Alumni</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Student Bio / Tagline
                </label>
                <textarea
                  rows={2}
                  maxLength={180}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Microbiology student interested in virology..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {success && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {tab === 'blocked' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Messages from blocked users are hidden from your live chat feeds.
              </p>
              {blockedUserIds.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  You haven't blocked any users.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUserIds.map((bId) => (
                    <div
                      key={bId}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-rose-400" />
                        <span className="text-xs text-slate-300 font-mono">
                          ID: {bId.slice(0, 12)}...
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnblock(bId)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Account Email:</span>
                  <p className="text-white font-medium mt-0.5">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Student UID:</span>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5">{user?.uid}</p>
                </div>
                <div>
                  <span className="text-slate-400">Member Since:</span>
                  <p className="text-slate-300 mt-0.5">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Member'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await logoutUser();
                }}
                className="w-full py-2.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of NABIOSOS Hub</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
