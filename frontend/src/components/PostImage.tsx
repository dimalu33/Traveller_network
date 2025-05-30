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

    const finalImageUrlToLoad = useMemo(() => {
        if (!imageUrl) { // Якщо imageUrl це null, undefined, або порожній рядок
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
                `[PostImage] Failed to parse imageUrl ('${imageUrl}') as a full URL. Error:`,
                error
            );
            // Спроба обробити, якщо це відносний шлях (малоймовірно, згідно з вашим API)
            if (typeof imageUrl === 'string') {
                if (imageUrl.startsWith('/processed_images/')) {
                    return `${IMAGE_SERVICE_BASE_URL}${imageUrl}`;
                }
                // Якщо це вже повний URL, який вказує на API Gateway
                if (imageUrl.startsWith(IMAGE_SERVICE_BASE_URL) && imageUrl.includes('/processed_images/')) {
                    return imageUrl;
                }
            }
            return null; // Повертаємо null, якщо не вдалося сформувати URL
        }
    }, [imageUrl]);

    useEffect(() => {
        if (finalImageUrlToLoad) {
            setIsLoading(true);
            setHasError(false);
            setDerivedImageUrl(finalImageUrlToLoad);
        } else if (imageUrl) {
            setIsLoading(false);
            setHasError(true);
            setDerivedImageUrl(imageUrl); // Для відображення проблемного URL
        } else { // imageUrl відсутній або невалідний
            setIsLoading(false);
            setHasError(false);
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

    // Якщо imageUrl спочатку null або undefined, нічого не рендеримо
    if (!imageUrl) {
        return null;
    }

    // Якщо URL не вдалося сформувати, або сталася помилка завантаження
    if (hasError || !finalImageUrlToLoad) {
        return (
            <div style={{
                width: '100%',
                minHeight: '200px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc3545',
                fontSize: '14px',
                borderTop: '1px solid #e1e8ed', // Додав верхній бордер для відокремлення
                borderBottom: '1px solid #e1e8ed', // Додав нижній бордер
                padding: '10px',
                textAlign: 'center',
                boxSizing: 'border-box'
            }}>
                <div>
                    📷 Зображення недоступне.
                    {derivedImageUrl && <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px' }}>URL: {derivedImageUrl}</div>}
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', position: 'relative', minHeight: isLoading ? '200px' : 'auto', borderTop: '1px solid #e1e8ed', borderBottom: '1px solid #e1e8ed' }}>
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
                    minHeight: '200px'
                }}>
                    Завантаження зображення...
                </div>
            )}
            <img
                src={finalImageUrlToLoad}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    maxHeight: '600px', // Збільшив максимальну висоту для кращого вигляду
                    objectFit: 'contain', // Змінив на contain, щоб бачити все зображення, можна повернути cover
                    display: 'block',
                    opacity: isLoading || hasError ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    backgroundColor: isLoading ? '#f0f0f0' : 'transparent' // Фон для лоадера
                }}
            />
        </div>
    );
};

export default PostImage;