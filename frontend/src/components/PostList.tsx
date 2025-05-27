// src/components/PostList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Post, getPosts } from '../services/api';
import PostItem from './PostItem';

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updatePostData = useCallback((postId: string, updatedData: Partial<Post>) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId ? { ...post, ...updatedData } : post
            )
        );
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedPosts = await getPosts();
                setPosts(fetchedPosts);
            } catch (err: any) {
                console.error('Failed to fetch posts:', err);
                setError(err.message || 'Не вдалося завантажити пости');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }}>
                <p>Завантаження постів...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }}>
                <div style={{
                    color: '#dc3545',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '1rem',
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    Помилка: {error}
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }}>
                <p style={{ color: '#666', fontSize: '18px' }}>
                    Постів ще немає
                </p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 1rem'
        }}>
            <h2 style={{
                textAlign: 'center',
                marginBottom: '2rem',
                color: '#333'
            }}>
                Останні пости ({posts.length})
            </h2>

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