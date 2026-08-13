import 'reflect-metadata';

import type { NextMiddleware } from 'middleware-io';
import type { MessageEventContext, Updates } from 'vk-io';

import { OnMessageEvent } from '../lib/decorators/listeners';
import { ListenersExplorerService } from '../lib/services';
import { matchMessageEventPayload } from '../lib/utils';
import { VK_LISTENERS_METADATA } from '../lib/vk.constants';

describe('OnMessageEvent', () => {
  function getListenerMetadata(
    condition?: Parameters<typeof OnMessageEvent>[0],
  ) {
    class UpdateHandler {
      onMessageEvent(): void {}
    }

    const descriptor = Object.getOwnPropertyDescriptor(
      UpdateHandler.prototype,
      'onMessageEvent',
    );

    if (!descriptor) {
      throw new Error('onMessageEvent descriptor is not defined');
    }

    OnMessageEvent(condition)(
      UpdateHandler.prototype,
      'onMessageEvent',
      descriptor,
    );

    return Reflect.getMetadata(VK_LISTENERS_METADATA, descriptor.value);
  }

  it('registers a listener without a payload condition', () => {
    expect(getListenerMetadata()).toEqual([
      {
        handlerType: 'message_event',
        method: undefined,
        event: undefined,
        args: [],
      },
    ]);
  });

  it('stores an object payload condition', () => {
    const condition = { broadcastAction: 'queue' };

    expect(getListenerMetadata(condition)[0]).toMatchObject({
      handlerType: 'message_event',
      event: condition,
    });
  });

  it('passes a matching payload to the Nest handler', async () => {
    const { explorer, updates, handled, next } = createExplorer({
      broadcastAction: 'queue',
    });

    registerListener(explorer, updates);
    await emitMessageEvent(
      updates,
      { eventPayload: { broadcastAction: 'queue' } } as MessageEventContext,
      next,
    );

    expect(updates.event).toBe('message_event');
    expect(handled).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes a non-matching payload to the next listener', async () => {
    const { explorer, updates, handled, next } = createExplorer({
      broadcastAction: 'queue',
    });

    registerListener(explorer, updates);
    await emitMessageEvent(
      updates,
      { eventPayload: { broadcastAction: 'settings' } } as MessageEventContext,
      next,
    );

    expect(handled).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('supports predicates for complex payload conditions', async () => {
    const { explorer, updates, handled, next } = createExplorer(
      (payload) => payload.phrase === 'schedule-notification',
    );

    registerListener(explorer, updates);
    await emitMessageEvent(
      updates,
      {
        eventPayload: { phrase: 'schedule-notification' },
      } as MessageEventContext,
      next,
    );

    expect(handled).toHaveBeenCalledTimes(1);
  });

  it('passes string payloads matching a string condition', async () => {
    const { explorer, updates, handled, next } = createExplorer('request_auth');

    registerListener(explorer, updates);
    await emitMessageEvent(
      updates,
      { eventPayload: 'request_auth' } as MessageEventContext,
      next,
    );

    expect(handled).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('stores string matches from string payloads in context $match', async () => {
    const { explorer, updates, handled, next } = createExplorer('request_auth');
    const context = {
      eventPayload: 'request_auth:secret-code',
    } as MessageEventContext & { $match?: RegExpMatchArray };

    registerListener(explorer, updates);
    await emitMessageEvent(updates, context, next);

    expect(handled).toHaveBeenCalledTimes(1);
    expect(context.$match?.[0]).toBe('request_auth');
    expect(next).not.toHaveBeenCalled();
  });

  it('stores regexp matches from string payloads in context $match', async () => {
    const { explorer, updates, handled, next } = createExplorer(
      /^request_auth:(?<code>.*):(?<state>.*)/,
    );
    const context = {
      eventPayload: 'request_auth:secret-code:state-json',
    } as MessageEventContext & { $match?: RegExpMatchArray };

    registerListener(explorer, updates);
    await emitMessageEvent(updates, context, next);

    expect(handled).toHaveBeenCalledTimes(1);
    expect(context.$match?.groups).toEqual({
      code: 'secret-code',
      state: 'state-json',
    });
  });

  it('passes non-matching string payloads to the next listener', async () => {
    const { explorer, updates, handled, next } =
      createExplorer(/^request_auth:/);

    registerListener(explorer, updates);
    await emitMessageEvent(
      updates,
      { eventPayload: 'another_action' } as MessageEventContext,
      next,
    );

    expect(handled).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('matches nested object conditions and regular expressions', () => {
    const context = {} as MessageEventContext;

    expect(
      matchMessageEventPayload(
        { action: { type: 'queue' } },
        { action: { type: 'queue' } },
        context,
      ),
    ).toBe(true);
    expect(
      matchMessageEventPayload(
        { broadcastAction: 'queue:today' },
        { broadcastAction: /^queue:/ },
        context,
      ),
    ).toBe(true);
  });
});

function createExplorer(condition: Parameters<typeof OnMessageEvent>[0]) {
  const handled = jest.fn();
  const next = jest.fn();
  const updates: {
    event?: string;
    handler?: (
      context: MessageEventContext,
      next: NextMiddleware,
    ) => Promise<void>;
    on: (
      event: string,
      handler: (
        context: MessageEventContext,
        next: NextMiddleware,
      ) => Promise<void>,
    ) => void;
  } = {
    on(event, handler) {
      this.event = event;
      this.handler = handler;
    },
  };
  const explorer = Object.create(
    ListenersExplorerService.prototype,
  ) as ListenersExplorerService;

  Object.assign(explorer, {
    vkOptions: {},
    metadataAccessor: {
      getListenerMetadata: () => [
        {
          handlerType: 'message_event',
          event: condition,
          args: [],
        },
      ],
    },
    createContextCallback: () => handled,
  });

  return { explorer, updates, handled, next };
}

function registerListener(
  explorer: ListenersExplorerService,
  updates: {
    on: (
      event: string,
      handler: (
        context: MessageEventContext,
        next: NextMiddleware,
      ) => Promise<void>,
    ) => void;
  },
): void {
  (
    explorer as unknown as {
      registerIfListener: (
        updates: Updates,
        instance: object,
        prototype: object,
        methodName: string,
      ) => void;
    }
  ).registerIfListener(
    updates as unknown as Updates,
    {},
    { onMessageEvent(): void {} },
    'onMessageEvent',
  );
}

async function emitMessageEvent(
  updates: {
    handler?: (
      context: MessageEventContext,
      next: NextMiddleware,
    ) => Promise<void>;
  },
  context: MessageEventContext,
  next: NextMiddleware,
): Promise<void> {
  if (!updates.handler) {
    throw new Error('message_event handler is not registered');
  }

  await updates.handler(context, next);
}
