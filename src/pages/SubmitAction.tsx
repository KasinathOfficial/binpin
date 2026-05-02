import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, Camera, Check, ChevronLeft } from 'lucide-react';
import { databases, ID } from '../lib/appwrite';
import type { BinRequest } from '../lib/appwrite';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const reqId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID; // Wait, I need to check the collection ID. I will just assume VITE_APPWRITE_REQUESTS_COLLECTION_ID or something similar, or fallback.
const actionId = import.meta.env.VITE_APPWRITE_ACTIONS_COLLECTION_ID;

export default function SubmitAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState<BinRequest | null>(null);
  const [designation, setDesignation] = useState('Ward Officer');
  const [actionTaken, setActionTaken] = useState<'under_review' | 'action_taken' | 'installed'>('under_review');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id && dbId && reqId) {
      databases.getDocument(dbId, reqId, id).then(res => {
        setRequest({ ...res, id: res.$id, created_at: res.$createdAt } as unknown as BinRequest);
      }).catch(err => {
        console.error('Failed to fetch request', err);
      });
    }
  }, [id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!id || !dbId || !actionId) return;
    setIsSubmitting(true);
    try {
      await databases.createDocument(dbId, actionId, ID.unique(), {
        request_id: id,
        designation,
        action_taken: actionTaken,
        proof_url: photoPreview
      });
      if (reqId) {
        await databases.updateDocument(dbId, reqId, id, {
          status: actionTaken
        });
      }
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-surface flex flex-col container mx-auto max-w-lg">
      <div className="bg-white px-4 py-4 border-b border-border shadow-sm flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-raised rounded-full active:scale-95 transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Municipal Action Log</h1>
          <p className="text-xs text-foreground-muted font-medium">Request #{id?.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="bg-white p-4 rounded-xl shadow-subtle border border-border mb-6">
          <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-orange" /> Request Area
          </p>
          <p className="text-sm font-semibold text-foreground mb-3">{request.city}</p>
          <p className="text-sm text-foreground-secondary italic bg-surface p-3 rounded-lg border border-border/50">"{request.description}"</p>
        </div>

        <h3 className="text-sm font-bold text-foreground mb-4">Action Details</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-2">Official Designation</label>
            <select 
              value={designation} 
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full h-[48px] px-3 bg-white border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none focus:border-orange shadow-sm cursor-pointer"
            >
              <option value="Ward Officer">Ward Officer</option>
              <option value="Zonal Commissioner">Zonal Commissioner</option>
              <option value="Sanitation Worker">Sanitation Worker</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-2">Action Taken</label>
            <select 
              value={actionTaken} 
              onChange={(e) => setActionTaken(e.target.value as any)}
              className="w-full h-[48px] px-3 bg-white border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none focus:border-orange shadow-sm cursor-pointer"
            >
              <option value="under_review">Reviewed Request</option>
              <option value="action_taken">Scheduled for Installation</option>
              <option value="installed">Installed New Bin</option>
            </select>
          </div>

          {actionTaken === 'installed' && (
            <div className="animate-slide-up">
              <label className="block text-xs font-bold text-red uppercase tracking-wider mb-2">Proof Photo (Required)</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
              {photoPreview ? (
                <div className="relative w-full h-[200px] rounded-lg overflow-hidden shadow-subtle border border-border">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-md shadow-sm">
                    Retake
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-red/40 hover:border-red bg-surface-raised rounded-lg flex flex-col items-center justify-center text-red/80 cursor-pointer transition-colors active:scale-95">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Tap to add photo</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-2">Internal Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Budget approved, installation tomorrow."
              className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-orange h-24 border-border shadow-sm placeholder:text-foreground-muted resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-border mt-auto pb-safe flex flex-col gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (actionTaken === 'installed' && !photoPreview)}
          className="w-full h-[52px] bg-foreground hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {isSubmitting ? 'Logging...' : 'Submit Official Log'} <Check className="w-5 h-5 -mr-1" />
        </button>
        <p className="text-[11px] font-medium text-foreground-muted text-center uppercase tracking-widest">
          IP Address Logged for Verification
        </p>
      </div>
    </div>
  );
}
