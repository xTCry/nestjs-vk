jest.mock('vk-io', () => ({
  Composer: {
    builder: jest.fn(() => ({
      compose: jest.fn(),
      use: jest.fn(),
    })),
  },
  VK: jest.fn().mockImplementation(() => ({
    updates: {
      start: jest.fn(),
      stop: jest.fn(),
      use: jest.fn(),
    },
  })),
}));

jest.mock('@vk-io/hear', () => ({
  HearManager: class {
    middleware = jest.fn();
    hear = jest.fn();
    onFallback = jest.fn();
  },
}));

jest.mock('@vk-io/scenes', () => ({
  SceneManager: class {
    middleware = jest.fn();
    middlewareIntercept = jest.fn();
    addScenes = jest.fn();
  },
  StepScene: class {
    constructor(
      public readonly sceneId: string,
      public readonly options: unknown,
    ) {}
  },
}));

jest.mock('@vk-io/session', () => ({
  SessionManager: class {
    middleware = jest.fn();
  },
}));
