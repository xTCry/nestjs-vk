import 'reflect-metadata';

import { Reflector } from '@nestjs/core';

import { Scene, Update } from '../lib/decorators/core';
import { AddStep, SceneEnter, SceneLeave } from '../lib/decorators/scene';

describe('reflectable decorators', () => {
  const reflector = new Reflector();

  it('stores update metadata under the decorator key', () => {
    @Update()
    class UpdateHandler {}

    expect(reflector.get(Update, UpdateHandler)).toBe(true);
  });

  it('stores scene metadata under the decorator key', () => {
    @Scene('simple-scene')
    class SimpleScene {}

    expect(reflector.get(Scene, SimpleScene)).toBe('simple-scene');
  });

  it('stores scene step metadata under the decorator key', () => {
    class SimpleScene {
      onStep(): void {}
    }

    const descriptor = getMethodDescriptor(SimpleScene.prototype, 'onStep');

    AddStep(2)(SimpleScene.prototype, 'onStep', descriptor);

    expect(reflector.get(AddStep, descriptor.value)).toBe(2);
  });

  it('stores scene action metadata under the decorator key', () => {
    class SimpleScene {
      onEnter(): void {}
      onLeave(): void {}
    }

    const enterDescriptor = getMethodDescriptor(
      SimpleScene.prototype,
      'onEnter',
    );
    const leaveDescriptor = getMethodDescriptor(
      SimpleScene.prototype,
      'onLeave',
    );

    SceneEnter()(SimpleScene.prototype, 'onEnter', enterDescriptor);
    SceneLeave()(SimpleScene.prototype, 'onLeave', leaveDescriptor);

    expect(reflector.get(SceneEnter, enterDescriptor.value)).toBe('enter');
    expect(reflector.get(SceneLeave, leaveDescriptor.value)).toBe('leave');
  });
});

function getMethodDescriptor(
  target: object,
  methodName: string,
): TypedPropertyDescriptor<() => void> {
  const descriptor = Object.getOwnPropertyDescriptor(target, methodName);

  if (!descriptor) {
    throw new Error(`${methodName} descriptor is not defined`);
  }

  return descriptor;
}
