const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'DetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const newReviewSection = `const ReviewSection = ({ itemId, itemType, userId, userName, language }: { itemId: string, itemType: string, userId: string | number | null | undefined, userName?: string | null, language: "ID" | "EN" }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", userName: userName || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for Edit & Reply
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReview, setEditReview] = useState({ rating: 5, comment: "" });
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyUserName, setReplyUserName] = useState(userName || "");

  useEffect(() => {
    fetchReviews();
  }, [itemId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(\`/api/reviews?itemId=\${itemId}\`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const targetUserName = parentId ? replyUserName : newReview.userName;
    const targetComment = parentId ? replyText : newReview.comment;
    
    if (!targetUserName || !targetComment) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemType,
          userId: userId || null,
          userName: targetUserName,
          rating: parentId ? undefined : newReview.rating,
          comment: targetComment,
          parentId
        })
      });
      if (res.ok) {
        if (parentId) {
          setReplyingTo(null);
          setReplyText("");
        } else {
          setNewReview({ rating: 5, comment: "", userName: userName || "" });
        }
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "EN" ? "Delete this review?" : "Hapus ulasan ini?")) return;
    try {
      const params = new URLSearchParams();
      params.append("_id", id);
      if (userId) params.append("userId", String(userId));
      if (userName) params.append("userName", userName);
      
      const res = await fetch(\`/api/reviews?\${params.toString()}\`, { method: 'DELETE' });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editReview.comment) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          rating: editReview.rating,
          comment: editReview.comment,
          userId: userId || null,
          userName: userName || null
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkOwnership = (rev: any) => {
    if (userId && rev.userId === String(userId)) return true;
    if (!rev.userId && userName && rev.userName === userName) return true;
    return false;
  };

  // Grouping replies
  const topLevelReviews = reviews.filter(r => !r.parentId);
  const getReplies = (parentId: string) => reviews.filter(r => r.parentId === parentId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderReview = (rev: any, isReply: boolean = false) => {
    const isOwner = checkOwnership(rev);
    const isEditing = editingId === rev._id;
    const isDeleted = rev.isDeleted;

    return (
      <div key={rev._id} className={\`py-4 flex flex-col gap-2.5 \${!isReply ? "border-b border-slate-100" : "mt-2 pt-2 border-t border-slate-50"}\`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className={\`\${isReply ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs"} rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-bold uppercase\`}>
              {isDeleted ? "-" : rev.userName.charAt(0)}
            </div>
            <div>
              <p className={\`font-bold \${isReply ? "text-[11px]" : "text-xs"} text-slate-800\`}>
                {isDeleted ? (language === "EN" ? "[Deleted User]" : "[Pengguna Dihapus]") : rev.userName}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {new Date(rev.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {rev.createdAt !== rev.updatedAt && !isDeleted && (language === "EN" ? " (Edited)" : " (Diedit)")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && !isEditing && !isDeleted && (
              <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(rev._id); setEditReview({ rating: rev.rating || 5, comment: rev.comment }); }} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(rev._id)} className="p-1 hover:bg-slate-50 rounded text-red-500" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!isEditing && !isReply && !isDeleted && (
              <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-1 rounded-md ml-1">
                <span className="text-[10px] font-bold text-amber-600 mr-1">{rev.rating}.0</span>
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={(e) => handleUpdate(e, rev._id)} className="mt-2 flex flex-col gap-3">
            {!isReply && (
              <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditReview({ ...editReview, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star className={\`w-3.5 h-3.5 \${star <= editReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}\`} />
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={editReview.comment}
              onChange={e => setEditReview({ ...editReview, comment: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-lg border border-slate-200 focus:border-slate-300 text-xs focus:outline-none transition-colors resize-none"
            />
            <div className="flex gap-2 self-end">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                {language === "EN" ? "Cancel" : "Batal"}
              </button>
              <button type="submit" disabled={!editReview.comment} className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors">
                {language === "EN" ? "Save" : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="pl-9">
            <p className={\`text-xs \${isDeleted ? "text-slate-400 italic" : "text-slate-600"} leading-relaxed\`}>
              {isDeleted ? (language === "EN" ? "This review has been deleted." : "Ulasan ini telah dihapus.") : rev.comment}
            </p>
            
            {/* Reply Button (Only on top-level and not deleted) */}
            {!isReply && !isDeleted && (
              <button 
                onClick={() => setReplyingTo(replyingTo === rev._id ? null : rev._id)}
                className="mt-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                {language === "EN" ? "Reply" : "Balas"}
              </button>
            )}
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === rev._id && !isReply && (
          <form onSubmit={(e) => handleSubmit(e, rev._id)} className="mt-3 ml-9 pl-3 border-l-2 border-slate-200 flex flex-col gap-2">
            {!userName && (
              <input
                type="text"
                placeholder={language === "EN" ? "Your Name" : "Nama Anda"}
                value={replyUserName}
                onChange={e => setReplyUserName(e.target.value)}
                required
                className="w-full sm:max-w-[200px] px-3 py-1.5 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded border border-transparent focus:border-slate-200 text-[11px] focus:outline-none transition-colors"
              />
            )}
            <div className="relative">
              <textarea
                placeholder={language === "EN" ? "Write a reply..." : "Tulis balasan..."}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-2 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-lg border border-transparent focus:border-slate-200 text-xs focus:outline-none transition-colors resize-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyText || (!userName && !replyUserName)}
                className="absolute bottom-2 right-2 p-1.5 bg-slate-800 text-white rounded flex items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          </form>
        )}

        {/* Render Replies */}
        {!isReply && getReplies(rev._id).length > 0 && (
          <div className="mt-3 ml-9 pl-4 border-l-2 border-slate-100 flex flex-col gap-0">
            {getReplies(rev._id).map(reply => renderReview(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 mt-2">
      {/* Form Tambah Ulasan */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          {language === "EN" ? "Leave a Review" : "Tulis Ulasan"}
        </h3>
        
        <form onSubmit={(e) => handleSubmit(e, null)} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {userName ? (
              <span className="text-xs text-slate-500 font-medium">
                {language === "EN" ? "Posting as" : "Mengulas sebagai"} <span className="text-slate-800 font-bold">{userName}</span>
              </span>
            ) : (
              <input
                type="text"
                placeholder={language === "EN" ? "Your Name" : "Nama Anda"}
                value={newReview.userName}
                onChange={e => setNewReview({ ...newReview, userName: e.target.value })}
                required
                className="w-full sm:max-w-[200px] px-3 py-2 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-lg border border-transparent focus:border-slate-200 text-xs focus:outline-none transition-colors"
              />
            )}
            
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={\`w-4 h-4 \${star <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}\`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              placeholder={language === "EN" ? "Share your experience..." : "Bagikan pengalaman Anda..."}
              value={newReview.comment}
              onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-slate-200 text-sm focus:outline-none transition-colors resize-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newReview.userName || !newReview.comment}
              className="absolute bottom-3 right-3 p-2 bg-slate-800 text-white rounded-lg flex items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all active:scale-95"
              title={language === "EN" ? "Submit" : "Kirim"}
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Ulasan */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {language === "EN" ? "Reviews" : "Ulasan"} <span className="text-slate-400 font-normal ml-1">({topLevelReviews.length})</span>
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat ulasan...
          </div>
        ) : topLevelReviews.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {language === "EN" ? "No reviews yet. Be the first to share your thoughts!" : "Belum ada ulasan. Bagikan pengalaman Anda pertama kali!"}
          </div>
        ) : (
          <div className="flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar pr-2 gap-0">
            {topLevelReviews.map((rev) => renderReview(rev))}
          </div>
        )}
      </div>
    </div>
  );
};`;

// Use regex to replace the entire ReviewSection component
const regex = /const ReviewSection = \(\{[\s\S]*?\}\);\s*(?=\s*export default function DetailModal)/m;
content = content.replace(regex, newReviewSection + '\n\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced ReviewSection with nested replies UI');
