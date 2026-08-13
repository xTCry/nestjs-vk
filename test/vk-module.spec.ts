import 'reflect-metadata';

import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

import {
  Hears,
  InjectVkHearManager,
  InjectVkSceneManager,
  InjectVkSessionManager,
  On,
  Update,
} from '../lib/decorators';
import { ListenersExplorerService } from '../lib/services';
import {
  getVkApiToken,
  getVkHearManagerToken,
  getVkListenersExplorerToken,
  getVkManagersOptionsToken,
  getVkSceneManagerToken,
  getVkSessionManagerToken,
} from '../lib/utils';
import { VkModule } from '../lib/vk.module';

@Update()
class CommonBotUpdate {
  @On('message')
  onCommonMessage(): void {}
}

@Update()
class SecondBotUpdate {
  @On('message')
  onSecondMessage(): void {}
}

@Module({
  providers: [CommonBotUpdate],
})
class CommonBotModule {}

@Module({
  providers: [SecondBotUpdate],
})
class SecondBotModule {}

let manuallyInjectedSecondHearManager: HearManager<MessageContext> | undefined;

@Update()
class ManualSecondBotUpdate {
  constructor(
    @InjectVkHearManager('secondBot')
    private readonly hearManager: HearManager<MessageContext>,
  ) {
    manuallyInjectedSecondHearManager = this.hearManager;
    this.hearManager.hear('manual-second', () => undefined);
  }

  @Hears('decorated-second')
  onDecoratedSecond(): void {}
}

@Module({
  providers: [ManualSecondBotUpdate],
})
class ManualSecondBotModule {}

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

  it('exports named managers for application providers', async () => {
    @Injectable()
    class MultiBotUpdateWithManagers {
      constructor(
        @InjectVkHearManager('firstBot')
        readonly firstHearManagerProvider: HearManager<MessageContext>,
        @InjectVkHearManager('secondBot')
        readonly secondHearManagerProvider: HearManager<MessageContext>,
        @InjectVkSessionManager('firstBot')
        readonly firstSessionManagerProvider: SessionManager,
        @InjectVkSessionManager('secondBot')
        readonly secondSessionManagerProvider: SessionManager,
        @InjectVkSceneManager('firstBot')
        readonly firstSceneManager: SceneManager,
        @InjectVkSceneManager('secondBot')
        readonly secondSceneManager: SceneManager,
      ) {}
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
        }),
      ],
      providers: [MultiBotUpdateWithManagers],
    }).compile();

    const update = moduleRef.get(MultiBotUpdateWithManagers);

    expect(update.firstHearManagerProvider).toBeDefined();
    expect(update.secondHearManagerProvider).toBeDefined();
    expect(update.firstHearManagerProvider).not.toBe(
      update.secondHearManagerProvider,
    );
    expect(update.firstSessionManagerProvider).not.toBe(
      update.secondSessionManagerProvider,
    );
    expect(update.firstSceneManager).not.toBe(update.secondSceneManager);

    await moduleRef.close();
  });

  it('uses named forManagers options only for the matching bot', async () => {
    const firstHearManager = new HearManager<MessageContext>();

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forManagers({ useHearManager: firstHearManager }, 'firstBot'),
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
        }),
      ],
    }).compile();

    expect(
      moduleRef.get(getVkHearManagerToken('firstBot'), { strict: false }),
    ).toBe(firstHearManager);
    expect(
      moduleRef.get(getVkHearManagerToken('secondBot'), { strict: false }),
    ).toBeDefined();
    expect(
      moduleRef.get(getVkHearManagerToken('firstBot'), { strict: false }),
    ).not.toBe(
      moduleRef.get(getVkHearManagerToken('secondBot'), { strict: false }),
    );
    expect(
      moduleRef.get(getVkSessionManagerToken('firstBot'), { strict: false }),
    ).toBeDefined();
    expect(
      moduleRef.get(getVkSceneManagerToken('firstBot'), { strict: false }),
    ).toBeDefined();

    await moduleRef.close();
  });

  it('uses named managers while registering listeners for matching bot', async () => {
    const firstHearManager = new HearManager<MessageContext>();

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forManagers({ useHearManager: firstHearManager }, 'firstBot'),
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule],
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule],
        }),
        CommonBotModule,
      ],
    }).compile();

    await moduleRef.init();

    const firstVk = moduleRef.get<{ updates: { use: jest.Mock } }>(
      getVkApiToken('firstBot'),
      { strict: false },
    );
    const secondVk = moduleRef.get<{ updates: { use: jest.Mock } }>(
      getVkApiToken('secondBot'),
      { strict: false },
    );

    expect(firstVk.updates.use).toHaveBeenCalledWith(
      firstHearManager.middleware,
    );
    expect(secondVk.updates.use).not.toHaveBeenCalledWith(
      firstHearManager.middleware,
    );

    await moduleRef.close();
  });

  it('uses named forManagers options regardless of import order', async () => {
    const firstHearManager = new HearManager<MessageContext>();

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule],
        }),
        VkModule.forManagers({ useHearManager: firstHearManager }, 'firstBot'),
        CommonBotModule,
      ],
    }).compile();

    await moduleRef.init();

    const firstVk = moduleRef.get<{ updates: { use: jest.Mock } }>(
      getVkApiToken('firstBot'),
      { strict: false },
    );

    expect(firstVk.updates.use).toHaveBeenCalledWith(
      firstHearManager.middleware,
    );

    await moduleRef.close();
  });

  it('shares named managers between application providers and explorer', async () => {
    manuallyInjectedSecondHearManager = undefined;

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forManagers({ useSceneManager: false }, 'secondBot'),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
          include: [ManualSecondBotModule],
        }),
        ManualSecondBotModule,
      ],
    }).compile();

    await moduleRef.init();

    const secondExplorer = moduleRef.get<{
      hearManagerProvider: HearManager<MessageContext>;
    }>(getVkListenersExplorerToken('secondBot'), { strict: false });

    expect(secondExplorer.hearManagerProvider).toBe(
      manuallyInjectedSecondHearManager,
    );
    expect(manuallyInjectedSecondHearManager?.length).toBe(2);

    await moduleRef.close();
  });

  it('keeps separate explorer options for each named bot', async () => {
    const firstManagersOptions = {
      useSceneManager: false,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forManagers(firstManagersOptions, 'firstBot'),
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule],
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule, SecondBotModule],
        }),
        CommonBotModule,
        SecondBotModule,
      ],
    }).compile();

    const firstExplorer = moduleRef.get<{
      vkName: string;
      vkOptions: { vkName?: string; include?: Function[] };
      vkManagersOptions: unknown;
    }>(getVkListenersExplorerToken('firstBot'), { strict: false });
    const secondExplorer = moduleRef.get<{
      vkName: string;
      vkOptions: { vkName?: string; include?: Function[] };
      vkManagersOptions: unknown;
    }>(getVkListenersExplorerToken('secondBot'), { strict: false });

    expect(firstExplorer.vkName).toBe(getVkApiToken('firstBot'));
    expect(secondExplorer.vkName).toBe(getVkApiToken('secondBot'));
    expect(firstExplorer.vkOptions.include).toEqual([CommonBotModule]);
    expect(secondExplorer.vkOptions.include).toEqual([
      CommonBotModule,
      SecondBotModule,
    ]);
    expect(firstExplorer.vkManagersOptions).toBe(firstManagersOptions);
    expect(secondExplorer.vkManagersOptions).toEqual({});
    expect(
      moduleRef.get(getVkManagersOptionsToken('firstBot'), { strict: false }),
    ).toBe(firstManagersOptions);

    await moduleRef.close();
  });

  it('registers included update modules per bot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule],
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
          include: [CommonBotModule, SecondBotModule],
        }),
        CommonBotModule,
        SecondBotModule,
      ],
    }).compile();

    await moduleRef.init();

    const firstVk = moduleRef.get<{ updates: { on: jest.Mock } }>(
      getVkApiToken('firstBot'),
      { strict: false },
    );
    const secondVk = moduleRef.get<{ updates: { on: jest.Mock } }>(
      getVkApiToken('secondBot'),
      { strict: false },
    );

    expect(firstVk.updates.on).toHaveBeenCalledTimes(1);
    expect(secondVk.updates.on).toHaveBeenCalledTimes(2);

    await moduleRef.close();
  });

  it('stops each named VK instance on application shutdown', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        VkModule.forRoot({
          vkName: 'firstBot',
          token: 'test-token',
          launchOptions: false,
        }),
        VkModule.forRoot({
          vkName: 'secondBot',
          token: 'test-token',
          launchOptions: false,
        }),
      ],
    }).compile();

    const firstVk = moduleRef.get<{ updates: { stop: jest.Mock } }>(
      getVkApiToken('firstBot'),
      { strict: false },
    );
    const secondVk = moduleRef.get<{ updates: { stop: jest.Mock } }>(
      getVkApiToken('secondBot'),
      { strict: false },
    );

    await moduleRef.close();

    expect(firstVk.updates.stop).toHaveBeenCalledTimes(1);
    expect(secondVk.updates.stop).toHaveBeenCalledTimes(1);
  });
});
