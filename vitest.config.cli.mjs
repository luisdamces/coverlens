/** Sin import de `vitest/config`: permite `npx -p vitest vitest run` cuando node_modules está incompleto. */
export default {
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
};
