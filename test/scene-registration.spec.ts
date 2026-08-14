import 'reflect-metadata';

import { MetadataScanner, Reflector } from '@nestjs/core';

import { Scene } from '../lib/decorators/core';
import { AddStep, SceneEnter, SceneLeave } from '../lib/decorators/scene';
import { ListenersExplorerService } from '../lib/services';

describe('scene registration', () => {
  it('registers enter, leave and explicitly ordered scene steps', () => {
    @Scene('explicit-steps-scene')
    class ExplicitStepsScene {
      @SceneEnter()
      onEnter(): void {}

      @AddStep(2)
      onThirdStep(): void {}

      @AddStep(0)
      onFirstStep(): void {}

      @SceneLeave()
      onLeave(): void {}

      @AddStep(1)
      onSecondStep(): void {}
    }

    const { explorer, sceneManager, handlers } = createSceneExplorer();

    registerScenes(explorer, new ExplicitStepsScene());

    const scene = getRegisteredScene(sceneManager);

    expect(scene.sceneId).toBe('explicit-steps-scene');
    expect(scene.options.enterHandler).toBe(handlers.get('onEnter'));
    expect(scene.options.leaveHandler).toBe(handlers.get('onLeave'));
    expect(scene.options.steps).toEqual([
      handlers.get('onFirstStep'),
      handlers.get('onSecondStep'),
      handlers.get('onThirdStep'),
    ]);
  });

  it('registers scene steps without explicit indexes in declaration order', () => {
    @Scene('auto-steps-scene')
    class AutoStepsScene {
      @AddStep()
      onFirstStep(): void {}

      @AddStep()
      onSecondStep(): void {}

      @AddStep()
      onThirdStep(): void {}
    }

    const { explorer, sceneManager, handlers } = createSceneExplorer();

    registerScenes(explorer, new AutoStepsScene());

    const scene = getRegisteredScene(sceneManager);

    expect(scene.sceneId).toBe('auto-steps-scene');
    expect(scene.options.enterHandler).toBeUndefined();
    expect(scene.options.leaveHandler).toBeUndefined();
    expect(scene.options.steps).toEqual([
      handlers.get('onFirstStep'),
      handlers.get('onSecondStep'),
      handlers.get('onThirdStep'),
    ]);
  });
});

type SceneExplorer = ListenersExplorerService;

type SceneExplorerPrivateApi = {
  registerScenes: (modules: unknown[]) => void;
};

type RegisteredScene = {
  sceneId: string;
  options: {
    enterHandler?: unknown;
    leaveHandler?: unknown;
    steps: unknown[];
  };
};

function createSceneExplorer(): {
  explorer: SceneExplorer;
  sceneManager: { addScenes: jest.Mock };
  handlers: Map<string, jest.Mock>;
} {
  const handlers = new Map<string, jest.Mock>();
  const sceneManager = { addScenes: jest.fn() };
  const explorer = Object.create(
    ListenersExplorerService.prototype,
  ) as SceneExplorer;

  Object.assign(explorer, {
    reflector: new Reflector(),
    metadataScanner: new MetadataScanner(),
    sceneManager,
    createContextCallback: (_instance: object, methodName: string) => {
      const handler = jest.fn();
      handlers.set(methodName, handler);

      return handler;
    },
  });

  return { explorer, sceneManager, handlers };
}

function registerScenes(explorer: SceneExplorer, instance: object): void {
  (explorer as unknown as SceneExplorerPrivateApi).registerScenes([
    createModuleWithProvider(instance),
  ]);
}

function createModuleWithProvider(instance: object): unknown {
  return {
    providers: new Map([
      [
        'scene',
        {
          instance,
          metatype: instance.constructor,
        },
      ],
    ]),
  };
}

function getRegisteredScene(sceneManager: {
  addScenes: jest.Mock;
}): RegisteredScene {
  expect(sceneManager.addScenes).toHaveBeenCalledTimes(1);

  const [[scenes]] = sceneManager.addScenes.mock.calls as [[RegisteredScene[]]];

  expect(scenes).toHaveLength(1);

  return scenes[0];
}
