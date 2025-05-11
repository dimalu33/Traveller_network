export interface User {
    id: string;
    name: string;
    email: string;
    created_at: Date;
    // password не повертається клієнту
}

export interface NewUser {
    name: string;
    email: string;
    password: string;
}