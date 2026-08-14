import type {
  Context,
  MessageContext,
  MessageEventAction,
  MessageEventContext,
} from 'vk-io';

import { applyListenerResult } from '../lib/utils';

describe('applyListenerResult', () => {
  it('replies to message contexts by default', async () => {
    const ctx = createMessageContext();

    await applyListenerResult(ctx, 'Hello', {});

    expect(ctx.reply).toHaveBeenCalledWith('Hello');
    expect(ctx.send).not.toHaveBeenCalled();
  });

  it('sends to message contexts when replyTo is disabled', async () => {
    const ctx = createMessageContext();

    await applyListenerResult(ctx, 'Hello', { replyTo: false });

    expect(ctx.send).toHaveBeenCalledWith('Hello');
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('answers message_event contexts with snackbar for string results', async () => {
    const ctx = createMessageEventContext();

    await applyListenerResult(ctx, 'Saved', {});

    expect(ctx.answer).toHaveBeenCalledWith({
      type: 'show_snackbar',
      text: 'Saved',
    });
  });

  it('answers message_event contexts with action object results', async () => {
    const ctx = createMessageEventContext();
    const action: MessageEventAction = {
      type: 'open_link',
      link: 'https://example.com',
    };

    await applyListenerResult(ctx, action, {});

    expect(ctx.answer).toHaveBeenCalledWith(action);
  });
});

function createMessageContext(): MessageContext & {
  reply: jest.Mock;
  send: jest.Mock;
} {
  return {
    is: jest.fn((types: string[]) => types.includes('message')),
    reply: jest.fn(),
    send: jest.fn(),
  } as unknown as MessageContext & { reply: jest.Mock; send: jest.Mock };
}

function createMessageEventContext(): MessageEventContext & {
  answer: jest.Mock;
} {
  return {
    is: jest.fn((types: string[]) => types.includes('message_event')),
    answer: jest.fn(),
  } as unknown as MessageEventContext & { answer: jest.Mock };
}
