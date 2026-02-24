import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Post from '../components/Post';
import PostComposer from '../components/PostComposer';
import api from '../api/client';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${postId}`)
      .then(({ data }) => { setData(data); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleReply = (newPost) => {
    setData(prev => ({
      ...prev,
      replies: [newPost, ...(prev.replies || [])],
      post: { ...prev.post, replies_count: prev.post.replies_count + 1 }
    }));
  };

  return (
    <div>
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-6 border-b border-x-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-x-bg-hover rounded-full transition-colors">
          <ArrowLeft size={20} className="text-x-text" />
        </button>
        <h1 className="text-x-text font-bold text-xl">Post</h1>
      </div>

      {loading ? (
        <div className="p-8 text-center text-x-text-secondary">Loading...</div>
      ) : data ? (
        <>
          <Post post={data.post} onDelete={() => navigate(-1)} />

          {/* Poll */}
          {data.poll && (
            <div className="border-b border-x-border px-4 py-3">
              <PollView poll={data.poll} postId={postId} />
            </div>
          )}

          <PostComposer
            replyToId={postId}
            onPost={handleReply}
            placeholder={`Reply to @${data.post.user?.username}...`}
          />

          {data.replies?.map(reply => (
            <Post key={reply.id} post={reply} />
          ))}

          {data.replies?.length === 0 && (
            <div className="text-center py-12 text-x-text-secondary">No replies yet</div>
          )}
        </>
      ) : null}
    </div>
  );
}

function PollView({ poll, postId }) {
  const [votes, setVotes] = useState(poll.votes || {});
  const [voted, setVoted] = useState(false);

  const totalVotes = Object.keys(votes).length;
  const isExpired = new Date(poll.expires_at) < new Date();

  const handleVote = async (optionIndex) => {
    if (voted || isExpired) return;
    try {
      const { data } = await api.post(`/posts/${postId}/poll/vote`, { option_index: optionIndex });
      setVotes(data.votes);
      setVoted(true);
    } catch {}
  };

  const getVoteCount = (index) => Object.values(votes).filter(v => v === index).length;
  const getPercentage = (index) => totalVotes ? Math.round((getVoteCount(index) / totalVotes) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="text-x-text font-bold mb-2">{poll.question}</div>
      {poll.options.map((option, i) => {
        const pct = getPercentage(i);
        const myVote = false;
        return (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={voted || isExpired}
            className="w-full relative rounded-full border border-x-border overflow-hidden text-left"
          >
            <div className="absolute inset-y-0 left-0 bg-x-blue/20 rounded-full transition-all" style={{ width: `${pct}%` }} />
            <div className="relative flex items-center justify-between px-4 py-2.5">
              <span className="text-x-text text-sm font-medium">{option}</span>
              {(voted || isExpired) && <span className="text-x-text-secondary text-sm">{pct}%</span>}
            </div>
          </button>
        );
      })}
      <div className="text-x-text-secondary text-xs">{totalVotes} votes · {isExpired ? 'Final results' : `Ends ${new Date(poll.expires_at).toLocaleDateString()}`}</div>
    </div>
  );
}
