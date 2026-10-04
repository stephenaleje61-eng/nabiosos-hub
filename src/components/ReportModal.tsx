import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../firebase/moderationService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    type: 'message' | 'space_message' | 'user';
    id: string;
    reportedUserId: string;
    reportedUserName?: string;
  } | null;
}

const REASONS = [
  'Spam or unapproved commercial ads',
  'Harassment, bullying, or hate speech',
  'Academic dishonesty or examination leakage',
  'Inappropriate or offensive media',
  'Impersonation of faculty or association executive',
  'Other violation',
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, target }) => {
  const { profile } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    try {
      await submitReport(
        profile.id,
        target.reportedUserId,
        target.type,
        target.id,
        reason,
        details
      );
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Report Content / User</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-slate-400">
              Thank you for keeping the NABIOSOS Hub safe and scholarly. Moderation has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <p className="text-xs text-slate-300">
              Reporting: <strong className="text-white">{target.reportedUserName || 'Target Item'}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Select Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Additional Information (optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any context for our moderation team..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              {submitting ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
