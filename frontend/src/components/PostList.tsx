// src/components/PostList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Post, getPosts, getLikesForPost, getCommentsForPost } from '../services/api';
import PostItem from './PostItem';

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Функція для оновлення даних конкретного поста в списку
    const updatePostData = useCallback((postId: string, updatedData: Partial<Post>) => {
        setPosts(prevPosts =>
            prevPosts.map(p =>
                p.id === postId ? { ...p, ...updatedData } : p
            )
        );
    }, []);

    useEffect(() => {
        const fetchInitialPosts = async () => {
            try {
                setLoading(true);
                const fetchedPosts = await getPosts();
                // Опціонально: відразу завантажити кількість лайків і коментарів для кожного поста
                // Або це можна зробити в PostItem при його відображенні
                // Тут я залишу це для PostItem, щоб зменшити початкове навантаження

                // Для прикладу, якщо б ми хотіли збагатити пости відразу:
                // const postsWithCounts = await Promise.all(
                //     fetchedPosts.map(async (post) => {
                //         const [likesData, commentsData] = await Promise.all([
                //             getLikesForPost(post.id),
                //             getCommentsForPost(post.id) // Або просто отримати кількість, якщо є такий ендпоінт
                //         ]);
                //         return {
                //             ...post,
                //             like_count: likesData.likeCount,
                //             comment_count: commentsData.length, // Припускаючи, що getCommentsForPost повертає масив
                //             comments: commentsData, // Можна відразу завантажити
                //             likes: likesData
                //         };
                //     })
                // );
                // setPosts(postsWithCounts);

                setPosts(fetchedPosts); // Простіший варіант, PostItem сам завантажить деталі
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch posts:", err);
                setError(err.message || "Не вдалося завантажити пости.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialPosts();
    }, []);

    if (loading) return <p>Завантаження постів...</p>;
    if (error) return <p style={{ color: 'red' }}>Помилка: {error}</p>;
    if (posts.length === 0) return <p>Постів ще немає.</p>;

    return (
        <div>
            {posts.map(post => (
                <PostItem key={post.id} post={post} onPostDataUpdate={updatePostData} />
            ))}
        </div>
    );
};

export default PostList;