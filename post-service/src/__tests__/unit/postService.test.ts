import { createPost, getAllPosts, addLikeToPost } from '../../services/postService';
import { pool } from '../../database';
import { v4 as uuidv4 } from 'uuid';
import { NewPostData } from '../../models/postTypes';

jest.mock('../../database', () => ({
    pool: {
        query: jest.fn(),
    },
}));
jest.mock('uuid', () => ({
    v4: jest.fn(),
}));

describe('PostService', () => {
    beforeEach(() => {
        (pool.query as jest.Mock).mockClear();
        (uuidv4 as jest.Mock).mockClear();
    });

    describe('createPost', () => {
        it('should create a post with undefined image_url (becomes null in DB) and return it', async () => {
            const inputPostData: NewPostData = {
                user_id: 'user1',
                text: 'Test post with undefined image',
            };
            const expectedPostId = 'mock-uuid-123';

            const expectedDbRow = {
                id: expectedPostId,
                user_id: inputPostData.user_id,
                text: inputPostData.text,
                image_url: null,
                created_at: expect.any(Date),
            };
            const mockDbResponse = { rows: [expectedDbRow] };

            (uuidv4 as jest.Mock).mockReturnValue(expectedPostId);
            (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

            const result = await createPost(inputPostData);

            expect(uuidv4).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO posts'),
                [
                    expectedPostId,
                    inputPostData.user_id,
                    inputPostData.text || null,
                    null,
                ]
            );
            expect(result).toEqual(expectedDbRow);
        });

        it('should create a post with explicitly null image_url and return it', async () => {
            const inputPostData: NewPostData = {
                user_id: 'user2',
                text: 'Test post with null image',
                image_url: null as any,
            };
            const expectedPostId = 'mock-uuid-456';

            const expectedDbRow = {
                id: expectedPostId,
                user_id: inputPostData.user_id,
                text: inputPostData.text,
                image_url: null,
                created_at: expect.any(Date),
            };
            const mockDbResponse = { rows: [expectedDbRow] };

            (uuidv4 as jest.Mock).mockReturnValue(expectedPostId);
            (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

            const result = await createPost(inputPostData);

            expect(uuidv4).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO posts'),
                [
                    expectedPostId,
                    inputPostData.user_id,
                    inputPostData.text,
                    null,
                ]
            );
            expect(result).toEqual(expectedDbRow);
        });
    });

    describe('addLikeToPost', () => {
        it('should add a like if post exists and user has not liked it yet', async () => {
            const likeData = { post_id: 'post1', user_id: 'user1' };
            const mockLikeId = 'like-uuid-456';
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [{ id: 'post1' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ id: mockLikeId, ...likeData, created_at: expect.any(Date) }] });
            (uuidv4 as jest.Mock).mockReturnValue(mockLikeId);

            const result = await addLikeToPost(likeData);

            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(uuidv4).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('id', mockLikeId);
        });

        it('should remove a like if post exists and user has already liked it', async () => {
            const likeData = { post_id: 'post1', user_id: 'user1' };
            const existingLikeId = 'existing-like-id';
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [{ id: 'post1' }] })
                .mockResolvedValueOnce({ rows: [{ id: existingLikeId }] })
                .mockResolvedValueOnce({ rows: [] });

            const result = await addLikeToPost(likeData);

            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(uuidv4).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Like removed' });
        });

        it('should throw 404 if post does not exist when trying to like', async () => {
            const likeData = { post_id: 'nonexistent-post', user_id: 'user1' };
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            await expect(addLikeToPost(likeData)).rejects.toMatchObject({
                message: 'Post not found',
                statusCode: 404,
            });
            expect(pool.query).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllPosts', () => {
        it('should retrieve all posts from the database ordered by creation date descending', async () => {
            const mockPosts = [
                { id: 'post1', user_id: 'user1', text: 'First post', image_url: null, created_at: new Date('2023-01-01T10:00:00Z') },
                { id: 'post2', user_id: 'user2', text: 'Second post', image_url: 'http://example.com/img.png', created_at: new Date('2023-01-02T12:00:00Z') },
            ];
            (pool.query as jest.Mock).mockResolvedValue({ rows: mockPosts });

            const result = await getAllPosts();

            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM posts ORDER BY created_at DESC'));
            expect(result).toEqual(mockPosts);
            expect(result.length).toBe(2);
        });

        it('should return an empty array if no posts exist', async () => {
            (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

            const result = await getAllPosts();

            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM posts ORDER BY created_at DESC'));
            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });
    });
});