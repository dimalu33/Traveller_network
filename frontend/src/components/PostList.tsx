// src/components/PostList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Post, getPosts } from '../services/api';
import PostItem from './PostItem';
import CreatePostForm from './CreatePostForm';

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true); // Початкове завантаження
    const [error, setError] = useState<string | null>(null);

    // fetchPosts тепер не залежить від loading
    const fetchPosts = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setLoading(true); // Встановлюємо loading тільки для початкового завантаження
        }
        setError(null);
        try {
            const fetchedPosts = await getPosts();
            setPosts(fetchedPosts);
        } catch (err: any) {
            console.error('Failed to fetch posts:', err);
            setError(err.message || 'Не вдалося завантажити пости');
        } finally {
            if (isInitialLoad) {
                setLoading(false); // Вимикаємо loading тільки після початкового завантаження
            }
        }
    }, []); // Пустий масив залежностей, якщо getPosts не змінюється

    useEffect(() => {
        fetchPosts(true); // Викликаємо з прапором початкового завантаження
    }, [fetchPosts]); // fetchPosts тепер стабільна, якщо getPosts стабільна

    const handlePostCreated = useCallback((newPostData: Post) => {
        setPosts(prevPosts => [newPostData, ...prevPosts]);
        // Можливо, тут варто викликати fetchPosts() для оновлення всього списку,
        // якщо createPost не повертає всіх потрібних даних або для консистентності,
        // але це залежить від вашої логіки. Поточний підхід (додавання на початок) є оптимістичним.
    }, []);

    const updatePostData = useCallback((postId: string, updatedData: Partial<Post>) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId ? { ...post, ...updatedData } : post
            )
        );
    }, []);

    // ... решта коду компонента (JSX) залишається такою ж

    if (loading && posts.length === 0) { // Показуємо лоадер тільки при першому завантаженні і якщо постів ще немає
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
                <p style={{ fontSize: '18px', color: '#657786' }}>Завантаження постів...</p>
            </div>
        );
    }

    if (error && posts.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: '1rem' }}>
                <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '1rem 1.5rem', borderRadius: '8px', textAlign: 'center', maxWidth: '600px' }}>
                    <p style={{margin: '0 0 0.5rem 0'}}>Помилка: {error}</p>
                    <button onClick={() => fetchPosts(true)} style={{ padding: '0.5em 1em', border: '1px solid #dc3545', borderRadius: '4px', background: 'none', color: '#dc3545', cursor: 'pointer' }}>
                        Спробувати ще
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1rem' }}>
            <CreatePostForm onPostCreated={handlePostCreated} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <h2 style={{ color: '#333', margin: 0 }}>
                    Стрічка постів
                </h2>
                {error && !loading && /* Показуємо помилку оновлення, якщо вона є і це не початкове завантаження */
                    <span style={{fontSize: '13px', color: 'red'}}>Не вдалося оновити: {error.length > 30 ? error.substring(0,27) + '...' : error}</span>
                }
            </div>

            {posts.length === 0 && !loading && ( // Перевірка !loading щоб не показувати, коли йде початкове завантаження
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ddd', textAlign: 'center' }}>
                    <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.5' }}>
                        Схоже, тут ще немає жодного поста. <br/>
                        Будьте першим, хто поділиться думками!
                    </p>
                </div>
            )}

            <div>
                {posts.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        onPostDataUpdate={updatePostData}
                    />
                ))}
            </div>
        </div>
    );
};

export default PostList;