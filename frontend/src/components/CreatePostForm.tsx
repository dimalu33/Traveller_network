// src/components/CreatePostForm.tsx
import React, { useState, useRef } from 'react';
import { createPost, Post } from '../services/api';

interface CreatePostFormProps {
    onPostCreated: (newPost: Post) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
            if (text.trim() || event.target.files[0]) setError(null);
        } else {
            setImageFile(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!text.trim() && !imageFile) {
            setError('Будь ласка, додайте текст або зображення.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('text', text.trim());
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            const newPost = await createPost(formData);
            onPostCreated(newPost);
            setText('');
            setImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setSuccessMessage('Пост успішно створено!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('Failed to create post:', err);
            const backendError = err.response?.data?.detail || err.response?.data?.message;
            setError(backendError || err.message || 'Не вдалося створити пост.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e1e8ed',
            borderRadius: '12px',
            marginBottom: '2rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>Створити новий пост</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <textarea
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (e.target.value.trim() || imageFile) setError(null);
                        }}
                        placeholder="Що у вас нового?"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                            resize: 'vertical'
                        }}
                        disabled={isSubmitting}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="imageFile-create" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                        Додати зображення (необов'язково):
                    </label>
                    <input
                        type="file"
                        id="imageFile-create"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                        disabled={isSubmitting}
                    />
                    {imageFile && (
                        <p style={{ fontSize: '13px', color: '#555', marginTop: '0.5rem' }}>
                            Обрано файл: {imageFile.name}
                        </p>
                    )}
                </div>

                {error && (
                    <div style={{
                        color: '#dc3545',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div style={{
                        color: '#155724',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '14px'
                    }}>
                        {successMessage}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || (!text.trim() && !imageFile)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: (isSubmitting || (!text.trim() && !imageFile)) ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: (isSubmitting || (!text.trim() && !imageFile)) ? 'not-allowed' : 'pointer',
                        opacity: (isSubmitting || (!text.trim() && !imageFile)) ? 0.65 : 1
                    }}
                >
                    {isSubmitting ? 'Публікація...' : 'Опублікувати'}
                </button>
            </form>
        </div>
    );
};

export default CreatePostForm;