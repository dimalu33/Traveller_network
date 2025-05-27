// src/components/PostItem.tsx
import React, { useState, useEffect } from 'react';
import { Post, Comment, getCommentsForPost, addCommentToPost, getLikesForPost, toggleLikePost, LikeInfo, IMAGE_SERVICE_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Для перевірки авторизації

interface PostItemProps {
    post: Post;
    onPostDataUpdate: (postId: string, updatedData: Partial<Post>) => void; // Для оновлення в батьківському компоненті
}

const PostItem: React.FC<PostItemProps> = ({ post, onPostDataUpdate }) => {
    const { token, user } = useAuth(); // Отримуємо токен і користувача
    const [comments, setComments] = useState<Comment[]>(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [likeInfo, setLikeInfo] = useState<LikeInfo | null>(post.likes || null);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    // Завантаження лайків при монтуванні, якщо їх ще немає
    useEffect(() => {
        if (!post.likes) { // Завантажуємо, тільки якщо дані ще не передані
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

    // Завантаження коментарів при розгортанні, якщо їх ще немає
    const fetchComments = () => {
        if (comments.length === 0 && !post.comments) { // Завантажуємо, тільки якщо дані ще не передані/завантажені
            setIsLoadingComments(true);
            getCommentsForPost(post.id)
                .then(data => {
                    setComments(data);
                    onPostDataUpdate(post.id, { comments: data });
                })
                .catch(console.error)
                .finally(() => setIsLoadingComments(false));
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
            alert("Будь ласка, увійдіть, щоб поставити лайк.");
            return;
        }
        try {
            // Оптимістичне оновлення (можна зробити складніше з перевіркою isLikedByUser)
            // Для простоти, просто перезавантажимо кількість лайків
            await toggleLikePost(post.id);
            const updatedLikeInfo = await getLikesForPost(post.id); // Оновлюємо кількість
            setLikeInfo(updatedLikeInfo);
            onPostDataUpdate(post.id, { likes: updatedLikeInfo });
        } catch (error) {
            console.error("Failed to like post:", error);
            alert("Не вдалося поставити лайк.");
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !token) {
            if(!token) alert("Будь ласка, увійдіть, щоб коментувати.");
            return;
        }
        try {
            const addedComment = await addCommentToPost(post.id, newComment);
            const updatedComments = [addedComment, ...comments]; // Додаємо новий коментар на початок
            setComments(updatedComments);
            setNewComment('');
            onPostDataUpdate(post.id, { comments: updatedComments, comment_count: (post.comment_count || 0) + 1 });
            if (!showComments) setShowComments(true); // Відкрити коментарі, якщо були закриті
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert("Не вдалося додати коментар.");
        }
    };

    const imageUrl = post.image_url ? `${IMAGE_SERVICE_BASE_URL}${post.image_url}` : null;

    return (
        <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            {/* Тут можна додати ім'я автора, якщо user_id розкривається в об'єкт користувача */}
            {/* <p>Автор: {post.user_id}</p> */}
            {imageUrl && (
                <img src={imageUrl} alt={`Post by ${post.user_id}`} style={{ maxWidth: '100%', maxHeight: '400px', display: 'block', margin: '0 auto 10px' }} />
            )}
            {post.text && <p>{post.text}</p>}

            <div>
                <button onClick={handleLike} disabled={!token || isLoadingLikes}>
                    Лайк ({isLoadingLikes ? '...' : likeInfo?.likeCount ?? post.like_count ?? 0})
                </button>
                <button onClick={handleToggleComments} style={{ marginLeft: '10px' }}>
                    Коментарі ({isLoadingComments ? '...' : comments.length > 0 ? comments.length : (post.comment_count ?? 0)})
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: '10px' }}>
                    {token && (
                        <form onSubmit={handleAddComment}>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ваш коментар..."
                                rows={2}
                                style={{ width: '90%', marginRight: '10px' }}
                                required
                            />
                            <button type="submit">Додати</button>
                        </form>
                    )}
                    {isLoadingComments && <p>Завантаження коментарів...</p>}
                    {!isLoadingComments && comments.length === 0 && <p>Коментарів ще немає.</p>}
                    <ul>
                        {comments.map(comment => (
                            <li key={comment.id} style={{ borderTop: '1px solid #eee', paddingTop: '5px', marginTop: '5px' }}>
                                <small> {/* Користувач: {comment.user_id} - тут можна ім'я юзера, якщо є */} </small>
                                <p>{comment.text}</p>
                                <small>{new Date(comment.created_at).toLocaleString()}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <small style={{ display: 'block', textAlign: 'right', color: '#777' }}>
                Опубліковано: {new Date(post.created_at).toLocaleString()}
            </small>
        </div>
    );
};

export default PostItem;