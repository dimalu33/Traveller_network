// src/components/PostImage.tsx
import React, { useState } from 'react';
import { IMAGE_SERVICE_BASE_URL } from '../services/api';

interface PostImageProps {
    imageUrl: string;
    alt: string;
}

const PostImage: React.FC<PostImageProps> = ({ imageUrl, alt }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const fullImageUrl = `${IMAGE_SERVICE_BASE_URL}${imageUrl}`;

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        console.error('Failed to load image:', fullImageUrl);
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError) {
        return (
            <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#657786',
                fontSize: '14px',
                border: '1px solid #e1e8ed'
            }}>
                📷 Зображення недоступне
            </div>
        );
    }

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#657786',
                    fontSize: '14px',
                    zIndex: 1
                }}>
                    Завантаження зображення...
                </div>
            )}
            <img
                src={fullImageUrl}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                }}
            />
        </div>
    );
};

export default PostImage;