// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true, // Автоматично очищати моки перед кожним тестом
    coverageDirectory: "coverage",
    collectCoverageFrom: [ // Вказуємо, які файли враховувати для покриття
        "src/**/*.ts",
        "!src/server.ts", // Зазвичай server.ts не містить багато логіки для юніт-тестування
        "!src/database.ts", // Аналогічно
        "!src/config.ts",
        "!src/models/**/*.ts", // Типи зазвичай не тестують
        "!src/rabbitmq/resultConsumer.ts" // Якщо його логіка складна, можна тестувати окремо
    ],
    modulePathIgnorePatterns: [
        "<rootDir>/image-processing-service/",
        "<rootDir>/user-service/"
    ]
    //setupFilesAfterEnv: ['./jest.setup.js'], // Опціонально, для глобальних налаштувань
};