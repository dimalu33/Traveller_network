import React, { useState, useEffect, useCallback } from 'react';
import {
    Post,
    Comment,
    getCommentsForPost,
    addCommentToPost,
    getLikesForPost,
    toggleLikePost,
    LikeInfo
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PostImage from './PostImage';

interface PostItemProps {
    post: Post;
    onPostDataUpdate: (postId: string, updatedData: Partial<Post>) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onPostDataUpdate }) => {
    const { token, user } = useAuth();
    const [comments, setComments] = useState<Comment[]>(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [likeInfo, setLikeInfo] = useState<LikeInfo | null>(post.likes || null);
    const [isLoadingLikes, setIsLoadingLikes] = useState(!post.likes);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        if (!post.likes) {
            setIsLoadingLikes(true);
            getLikesForPost(post.id)
                .then(data => {
                    setLikeInfo(data);
                    onPostDataUpdate(post.id, { likes: data, like_count: data.likeCount });
                })
                .catch(error => {
                    console.error(`Failed to fetch likes for post ${post.id}:`, error);
                    const fallbackLikeInfo = { postId: post.id, likeCount: post.like_count || 0, isLikedByUser: false };
                    setLikeInfo(fallbackLikeInfo);
                    onPostDataUpdate(post.id, { likes: fallbackLikeInfo, like_count: fallbackLikeInfo.likeCount });
                })
                .finally(() => setIsLoadingLikes(false));
        } else {
            setIsLoadingLikes(false);
        }
    }, [post.id, post.likes, post.like_count, onPostDataUpdate]);

    const fetchComments = useCallback(async () => {
        if (!comments.length && (!post.comments || post.comments.length === 0)) {
            setIsLoadingComments(true);
            try {
                const data = await getCommentsForPost(post.id);
                setComments(data);
                onPostDataUpdate(post.id, {
                    comments: data,
                    comment_count: data.length
                });
            } catch (error) {
                console.error(`Failed to fetch comments for post ${post.id}:`, error);
            } finally {
                setIsLoadingComments(false);
            }
        } else if (post.comments && post.comments.length > 0 && comments.length === 0) {
            setComments(post.comments);
            setIsLoadingComments(false);
        } else {
            setIsLoadingComments(false);
        }
    }, [post.id, post.comments, comments, onPostDataUpdate]);


    const handleToggleComments = () => {
        const newShowState = !showComments;
        setShowComments(newShowState);
        if (newShowState && (!comments.length && (!post.comments || post.comments.length === 0))) {
            fetchComments();
        }
    };

    const handleLike = async () => {
        if (!token) {
            alert('Будь ласка, увійдіть, щоб поставити лайк');
            return;
        }
        const originalLikeInfo = likeInfo;
        const newLikeCount = likeInfo ? (likeInfo.isLikedByUser ? likeInfo.likeCount - 1 : likeInfo.likeCount + 1) : 1;
        const newIsLiked = likeInfo ? !likeInfo.isLikedByUser : true;

        setLikeInfo({
            postId: post.id,
            likeCount: newLikeCount < 0 ? 0 : newLikeCount,
            isLikedByUser: newIsLiked
        });

        try {
            await toggleLikePost(post.id);
            const updatedLikeInfoFromServer = await getLikesForPost(post.id);
            setLikeInfo(updatedLikeInfoFromServer);
            onPostDataUpdate(post.id, { likes: updatedLikeInfoFromServer, like_count: updatedLikeInfoFromServer.likeCount });
        } catch (error) {
            console.error('Failed to like post:', error);
            alert('Не вдалося поставити лайк. Спробуйте ще раз.');
            setLikeInfo(originalLikeInfo);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !token) return;

        setIsSubmittingComment(true);
        try {
            const addedComment = await addCommentToPost(post.id, newComment.trim());
            const updatedComments = [addedComment, ...comments];
            setComments(updatedComments);
            setNewComment('');
            onPostDataUpdate(post.id, {
                comments: updatedComments,
                comment_count: (post.comment_count || 0) + 1
            });
            if (!showComments) setShowComments(true);
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Не вдалося додати коментар');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const imageUrl = post.image_url;
    const postAuthorName = post.author?.name || `Користувач ${post.user_id.slice(0, 6)}...`;
    const postAuthorEmail = post.author?.email;

    const displayCommentCount = isLoadingComments && !comments.length ? '...' : (post.comment_count ?? comments.length ?? 0);
    const displayLikeCount = likeInfo?.likeCount ?? post.like_count ?? 0;
    const isLikedOptimistically = likeInfo?.isLikedByUser ?? false;

    return (
        <article style={{
            backgroundColor: 'white',
            border: '1px solid #e1e8ed',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{
                padding: '1rem',
                borderBottom: imageUrl ? 'none' : '1px solid #e1e8ed',
                backgroundColor: '#fdfdfd'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong style={{ fontSize: '16px', color: '#14171a' }}>{postAuthorName}</strong>
                        {postAuthorEmail && <div style={{ fontSize: '14px', color: '#657786' }}>{postAuthorEmail}</div>}
                    </div>
                    <small style={{ color: '#657786', fontSize: '12px' }}>
                        {new Date(post.created_at).toLocaleString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </small>
                </div>
            </div>

            {imageUrl && (
                <PostImage
                    imageUrl={imageUrl}
                    alt={`Зображення до поста від ${postAuthorName}`}
                />
            )}

            <div style={{ padding: '1rem' }}>
                {post.text && (
                    <p style={{
                        margin: '0 0 1rem 0',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#14171a',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {post.text}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e1e8ed' }}>
                    <button
                        onClick={handleLike}
                        disabled={!token}
                        title={isLikedOptimistically ? "Прибрати лайк" : "Поставити лайк"}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: isLikedOptimistically ? '#e0245e' : '#1da1f2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: (!token) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: (!token) ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}
                    >
                        {isLikedOptimistically ? '❤️' : '🤍'} Лайк ({displayLikeCount})
                    </button>
                    <button
                        onClick={handleToggleComments}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f5f8fa',
                            color: '#1da1f2',
                            border: '1px solid #e1e8ed',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}
                    >
                        💬 Коментарі ({displayCommentCount})
                    </button>
                </div>

                {showComments && (
                    <div style={{ paddingTop: '1rem' }}>
                        {token && user && (
                            <form onSubmit={handleAddComment} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f8fa', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#14171a' }}>{user.name || user.email}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Ваш коментар..."
                                        rows={2}
                                        disabled={isSubmittingComment}
                                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #e1e8ed', borderRadius: '4px', fontSize: '14px', resize: 'vertical', minHeight: '60px' }}
                                        required
                                    />
                                    <button type="submit" disabled={!newComment.trim() || isSubmittingComment} style={{ padding: '0.5rem 1rem', backgroundColor: (!newComment.trim() || isSubmittingComment) ? '#ccd6dd' : '#1da1f2', color: 'white', border: 'none', borderRadius: '4px', cursor: (!newComment.trim() || isSubmittingComment) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {isSubmittingComment ? 'Додавання...' : 'Додати'}
                                    </button>
                                </div>
                            </form>
                        )}
                        {isLoadingComments && !comments.length ? (
                            <p style={{ textAlign: 'center', color: '#657786' }}>Завантаження коментарів...</p>
                        ) : comments.length === 0 && !isLoadingComments ? (
                            <p style={{ textAlign: 'center', color: '#657786' }}>Коментарів ще немає. Будьте першим!</p>
                        ) : (
                            <div>
                                {comments.map(comment => (
                                    <div key={comment.id} style={{ padding: '0.75rem', borderTop: '1px solid #e1e8ed', backgroundColor: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <strong style={{ color: '#14171a', fontSize: '14px' }}>{comment.user?.name || `Користувач ${comment.user_id.slice(0, 6)}...`}</strong>
                                            <small style={{ color: '#657786', fontSize: '12px' }}>{new Date(comment.created_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#14171a', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};

export default PostItem;