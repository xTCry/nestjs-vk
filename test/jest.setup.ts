jest.mock('vk-io', () => ({
  Composer: {
    builder: jest.fn(),
  },
}));
