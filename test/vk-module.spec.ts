import 'reflect-metadata';

import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

import {
  InjectVkHearManager,
  InjectVkSceneManager,
  InjectVkSessionManager,
} from '../lib/decorators';
import { ListenersExplorerService } from '../lib/services';
import { VkModule } from '../lib/vk.module';

describe('VkModule', () => {
  it('uses default managers when forManagers is not imported with forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({ token: 'test-token', launchOptions: false }),
      ],
    }).compile();

    const explorer = moduleRef.get(ListenersExplorerService);
    const internals = explorer as unknown as {
      hearManagerProvider: unknown;
      sessionManagerProvider: unknown;
      sceneManager: unknown;
      vkManagersOptions: unknown;
    };

    expect(internals.vkManagersOptions).toEqual({});
    expect(internals.hearManagerProvider).toBeDefined();
    expect(internals.sessionManagerProvider).toBeDefined();
    expect(internals.sceneManager).toBeDefined();

    await moduleRef.close();
  });

  it('uses default managers when forManagers is not imported with forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRootAsync({
          useFactory: () => ({ token: 'test-token', launchOptions: false }),
        }),
      ],
    }).compile();

    const explorer = moduleRef.get(ListenersExplorerService);
    const internals = explorer as unknown as {
      hearManagerProvider: unknown;
      sessionManagerProvider: unknown;
      sceneManager: unknown;
      vkManagersOptions: unknown;
    };

    expect(internals.vkManagersOptions).toEqual({});
    expect(internals.hearManagerProvider).toBeDefined();
    expect(internals.sessionManagerProvider).toBeDefined();
    expect(internals.sceneManager).toBeDefined();

    await moduleRef.close();
  });

  it('keeps forManagers options when they are imported explicitly', async () => {
    const managersOptions = {
      useSessionManager: false,
      useSceneManager: false,
      useHearManager: false,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forManagers(managersOptions),
        VkModule.forRoot({ token: 'test-token', launchOptions: false }),
      ],
    }).compile();

    const explorer = moduleRef.get(ListenersExplorerService);
    const internals = explorer as unknown as {
      vkManagersOptions: unknown;
    };

    expect(internals.vkManagersOptions).toBe(managersOptions);

    await moduleRef.close();
  });

  it('exports default managers for application providers without forManagers', async () => {
    @Injectable()
    class BotUpdateWithManagers {
      constructor(
        @InjectVkHearManager()
        readonly hearManagerProvider: HearManager<MessageContext>,
        @InjectVkSessionManager()
        readonly sessionManagerProvider: SessionManager,
        @InjectVkSceneManager()
        readonly sceneManager: SceneManager,
      ) {}
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({ token: 'test-token', launchOptions: false }),
      ],
      providers: [BotUpdateWithManagers],
    }).compile();

    const update = moduleRef.get(BotUpdateWithManagers);

    expect(update.hearManagerProvider).toBeDefined();
    expect(update.sessionManagerProvider).toBeDefined();
    expect(update.sceneManager).toBeDefined();

    await moduleRef.close();
  });
});
