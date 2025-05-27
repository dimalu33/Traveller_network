// src/components/PostItem.tsx
import React, { useState, useEffect } from 'react';
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
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Завантаження лайків при монтуванні
    useEffect(() => {
        if (!post.likes) {
            setIsLoadingLikes(true);
            getLikesForPost(post.id)
                .then(data => {
                    setLikeInfo(data);
                    onPostDataUpdate(post.id, { likes: data });
                })
                .catch(console.error)
                .finally(() => setIsLoadingLikes(false));
        }
    }, [post.id, post.likes, onPostDataUpdate]);

    const fetchComments = async () => {
        if (comments.length === 0 && !post.comments) {
            setIsLoadingComments(true);
            try {
                const data = await getCommentsForPost(post.id);
                setComments(data);
                onPostDataUpdate(post.id, {
                    comments: data,
                    comment_count: data.length
                });
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            } finally {
                setIsLoadingComments(false);
            }
        }
    };

    const handleToggleComments = () => {
        const newShowState = !showComments;
        setShowComments(newShowState);
        if (newShowState && comments.length === 0) {
            fetchComments();
        }
    };

    const handleLike = async () => {
        if (!token) {
            alert('Будь ласка, увійдіть, щоб поставити лайк');
            return;
        }

        try {
            await toggleLikePost(post.id);
            const updatedLikeInfo = await getLikesForPost(post.id);
            setLikeInfo(updatedLikeInfo);
            onPostDataUpdate(post.id, { likes: updatedLikeInfo });
        } catch (error) {
            console.error('Failed to like post:', error);
            alert('Не вдалося поставити лайк');
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        if (!token) {
            alert('Будь ласка, увійдіть, щоб коментувати');
            return;
        }

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

            if (!showComments) {
                setShowComments(true);
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Не вдалося додати коментар');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const imageUrl = post.image_url;


    return (
        <article style={{
            backgroundColor: 'white',
            border: '1px solid #e1e8ed',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Заголовок поста з автором */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e1e8ed',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <strong style={{ fontSize: '16px', color: '#333' }}>
                            {post.author?.name || `Користувач ${post.user_id.slice(0, 8)}...`}
                        </strong>
                        <div style={{ fontSize: '14px', color: '#657786' }}>
                            {post.author?.email}
                        </div>
                    </div>
                    <small style={{ color: '#657786', fontSize: '12px' }}>
                        {new Date(post.created_at).toLocaleString('uk-UA')}
                    </small>
                </div>
            </div>

            {/* Зображення */}
            {imageUrl && (
                <PostImage
                    imageUrl={imageUrl}
                    alt={`Post by ${post.author?.name || post.user_id}`}
                />
            )}

            {/* Контент */}
            <div style={{ padding: '1rem' }}>
                {post.text && (
                    <p style={{
                        margin: '0 0 1rem 0',
                        fontSize: '16px',
                        lineHeight: '1.5',
                        color: '#333',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {post.text}
                    </p>
                )}

                {/* Кнопки дій */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e1e8ed'
                }}>
                    <button
                        onClick={handleLike}
                        disabled={!token || isLoadingLikes}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: !token ? '#f7f9fa' : '#1da1f2',
                            color: !token ? '#657786' : 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: (!token || isLoadingLikes) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: (!token || isLoadingLikes) ? 0.6 : 1
                        }}
                    >
                        ❤️ Лайк ({isLoadingLikes ? '...' : likeInfo?.likeCount ?? post.like_count ?? 0})
                    </button>

                    <button
                        onClick={handleToggleComments}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f7f9fa',
                            color: '#1da1f2',
                            border: '1px solid #e1e8ed',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        💬 Коментарі ({isLoadingComments ? '...' : comments.length})
                    </button>
                </div>

                {/* Секція коментарів */}
                {showComments && (
                    <div style={{ paddingTop: '1rem' }}>
                        {/* Форма додавання коментаря */}
                        {token && (
                            <form
                                onSubmit={handleAddComment}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f7f9fa',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#333' }}>
                                        {user?.name || user?.email}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Ваш коментар..."
                                        rows={2}
                                        disabled={isSubmittingComment}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid #e1e8ed',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            minHeight: '60px'
                                        }}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSubmittingComment}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: (!newComment.trim() || isSubmittingComment) ? '#f7f9fa' : '#1da1f2',
                                            color: (!newComment.trim() || isSubmittingComment) ? '#657786' : 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: (!newComment.trim() || isSubmittingComment) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {isSubmittingComment ? 'Додавання...' : 'Додати'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Список коментарів */}
                        {isLoadingComments ? (
                            <p style={{ textAlign: 'center', color: '#657786' }}>
                                Завантаження коментарів...
                            </p>
                        ) : comments.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#657786' }}>
                                Коментарів ще немає
                            </p>
                        ) : (
                            <div>
                                {comments.map(comment => (
                                    <div
                                        key={comment.id}
                                        style={{
                                            padding: '0.75rem',
                                            borderTop: '1px solid #e1e8ed',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <strong style={{ color: '#333', fontSize: '14px' }}>
                                                {comment.user?.name || `Користувач ${comment.user_id.slice(0, 8)}...`}
                                            </strong>
                                            <small style={{ color: '#657786', fontSize: '12px' }}>
                                                {new Date(comment.created_at).toLocaleString('uk-UA')}
                                            </small>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            lineHeight: '1.4',
                                            color: '#333',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {comment.text}
                                        </p>
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