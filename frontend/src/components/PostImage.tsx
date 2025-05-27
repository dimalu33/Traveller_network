// src/components/PostImage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { IMAGE_SERVICE_BASE_URL } from '../services/api'; // Це має бути http://localhost:8000

interface PostImageProps {
    imageUrl: string | null | undefined; // Дозволяємо null або undefined для більшої гнучкості
    alt: string;
}

const PostImage: React.FC<PostImageProps> = ({ imageUrl, alt }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [derivedImageUrl, setDerivedImageUrl] = useState<string | null>(null);

    // Використовуємо useMemo для обчислення URL, щоб це відбувалося лише при зміні imageUrl
    const finalImageUrlToLoad = useMemo(() => {
        if (!imageUrl) {
            return null;
        }

        try {
            // imageUrl це, наприклад, "http://localhost:3003/processed_images/image.png"
            const urlObject = new URL(imageUrl);
            // urlObject.pathname буде "/processed_images/image.png"
            // IMAGE_SERVICE_BASE_URL це "http://localhost:8000"
            const gatewayUrl = `${IMAGE_SERVICE_BASE_URL}${urlObject.pathname}`;
            // В результаті gatewayUrl буде "http://localhost:8000/processed_images/image.png"
            return gatewayUrl;
        } catch (error) {
            console.error(
                `[PostImage] Failed to parse imageUrl ('${imageUrl}') as a full URL. Assuming it might be a relative path or invalid. Error:`,
                error
            );
            // Якщо це не повний URL, і якщо він не починається з '/', додамо слеш.
            // Це запасний варіант, якщо дані з бекенду несподівано зміняться.
            // У вашому випадку, згідно з відповіддю API, imageUrl завжди повний.
            if (typeof imageUrl === 'string') {
                // Якщо це вже відносний шлях, який потрібен (малоймовірно у вашому випадку)
                if (imageUrl.startsWith('/processed_images/')) {
                    return `${IMAGE_SERVICE_BASE_URL}${imageUrl}`;
                }
                // Якщо це просто ім'я файлу (ще менш ймовірно)
                // return `${IMAGE_SERVICE_BASE_URL}/processed_images/${imageUrl}`;
            }
            return null; // Повертаємо null, якщо не вдалося сформувати URL
        }
    }, [imageUrl]); // Залежність від imageUrl

    useEffect(() => {
        // Оновлюємо стани, коли finalImageUrlToLoad змінюється
        if (finalImageUrlToLoad) {
            setIsLoading(true);
            setHasError(false);
            setDerivedImageUrl(finalImageUrlToLoad); // Зберігаємо для відображення у випадку помилки
        } else if (imageUrl) { // Якщо imageUrl є, але finalImageUrlToLoad став null (помилка парсингу)
            setIsLoading(false);
            setHasError(true);
            setDerivedImageUrl(imageUrl); // Показуємо оригінальний URL, з яким виникла проблема
        } else { // Якщо imageUrl немає
            setIsLoading(false);
            setHasError(false); // Немає помилки, просто немає зображення
            setDerivedImageUrl(null);
        }
    }, [finalImageUrlToLoad, imageUrl]);

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        console.error('[PostImage] Failed to load image:', finalImageUrlToLoad || derivedImageUrl || "URL not available");
        setIsLoading(false);
        setHasError(true);
    };

    if (!imageUrl) { // Якщо imageUrl відсутній з самого початку
        return null; // Або показати плейсхолдер, якщо потрібно
    }

    if (hasError || !finalImageUrlToLoad) { // Якщо сталася помилка або URL не вдалося сформувати
        return (
            <div style={{
                width: '100%',
                minHeight: '200px', // Використовуємо minHeight для кращого вигляду
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc3545', // Червоний колір для помилки
                fontSize: '14px',
                border: '1px solid #e1e8ed',
                padding: '10px',
                textAlign: 'center'
            }}>
                <div>
                    📷 Зображення недоступне.
                    {derivedImageUrl && <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px' }}>URL: {derivedImageUrl}</div>}
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', position: 'relative', minHeight: isLoading ? '200px' : 'auto' /* Плейсхолдер поки завантажується */ }}>
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
                    zIndex: 1,
                    minHeight: '200px' // Щоб лоадер мав розмір
                }}>
                    Завантаження зображення...
                </div>
            )}
            <img
                src={finalImageUrlToLoad} // Завжди використовуємо цей URL для тегу img
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: isLoading || hasError ? 0 : 1, // Ховаємо, якщо завантаження або помилка
                    transition: 'opacity 0.3s ease'
                }}
            />
        </div>
    );
};

export default PostImage;