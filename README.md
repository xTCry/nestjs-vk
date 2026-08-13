# NestJS VK

[![npm](https://img.shields.io/npm/v/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![NPM](https://img.shields.io/npm/dt/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-vk)](https://github.com/xtcry/nestjs-vk)

[English documentation](./README.en.md)

<img src="https://nestjs.com/img/logo-small.svg" title="NestJS logotype" align="right" width="95" height="148">

**NestJS VK** — модуль для создания VK-ботов на NestJS.

Пакет использует [VK-IO](https://github.com/negezor/vk-io) для работы с VK API
и [NestJS](https://github.com/nestjs) для интеграции бота в архитектуру
приложения.

Модуль помогает подключить VK API, обработчики событий, middleware, guards,
interceptors, filters, pipes, hears-обработчики и scenes в NestJS-приложении.

**Возможности**

- Простое подключение VK-бота в NestJS.
- Поддержка собственных декораторов.
- Поддержка scenes.
- Запуск нескольких ботов одновременно.
- Поддержка NestJS guards, interceptors, filters и pipes.

## Установка

#### NPM

```bash
$ npm i nestjs-vk vk-io
```

#### Yarn

```bash
$ yarn add nestjs-vk vk-io
```

## Использование

После установки импортируйте `VkModule` в корневой `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';

@Module({
  imports: [
    VkModule.forRoot({
      token: process.env.VK_BOT_TOKEN,
      options: {
        pollingGroupId: +process.env.VK_BOT_GROUP_ID,
        apiMode: 'sequential',
      },
    }),
  ],
  providers: [AppUpdate],
})
export class AppModule {}
```

Создайте `app.update.ts`:

```typescript
import { Ctx, Hears, Update } from 'nestjs-vk';
import { MessageContext } from 'vk-io';

@Update()
export class AppUpdate {
  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Ctx() ctx: MessageContext) {
    await ctx.reply('Добро пожаловать');
  }
}
```

Для callback-кнопок можно использовать `OnMessageEvent`:

```typescript
import { Ctx, OnMessageEvent, Update } from 'nestjs-vk';
import { MessageEventContext } from 'vk-io';

@Update()
export class AppUpdate {
  @OnMessageEvent({ action: 'open_queue' })
  async onOpenQueue(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Очередь открыта' });
  }
}
```

<details>
<summary>Настройка managers через <code>VkModule.forManagers()</code></summary>

`VkModule.forManagers()` не обязателен для стандартного запуска. Без него
`nestjs-vk` автоматически создаёт и регистрирует `SessionManager`,
`SceneManager` и `HearManager`.

Используйте `VkModule.forManagers()` только если нужно:

- отключить один из default managers;
- передать собственный экземпляр manager;
- отключить автоматическую регистрацию manager middleware, чтобы подключить его
  вручную в `middlewaresBefore` / `middlewaresAfter`;
- сделать эти настройки для конкретного `vkName`.

Для нескольких ботов можно настроить managers конкретного бота через второй
аргумент `vkName`:

```typescript
VkModule.forManagers(
  {
    useSceneManager: false,
  },
  'firstBot',
);
```

`forManagers()` не создаёт отдельную вторую копию manager-а поверх `forRoot()`.
Он задаёт options, по которым `forRoot()` / `forRootAsync()` создадут и
подключат managers этого бота. Поэтому `@InjectVkHearManager('firstBot')` и
внутренняя регистрация `@Hears()` используют один и тот же `HearManager`.

Пустой вызов `VkModule.forManagers({}, 'firstBot')` обычно не нужен: он
эквивалентен дефолтному поведению. Используйте его только если так удобнее
явно показать, что настройки managers для этого бота оставлены стандартными.

Если указать `useSceneManager: false`, модуль не подключит
`SceneManager.middleware` и `SceneManager.middlewareIntercept` для этого бота.
В таком режиме `ctx.scene.enter(...)` и обработка текущей scene для этого бота
не будут работать, пока вы не подключите scene middleware вручную.

</details>

<details>
<summary>Расширенная настройка модуля, middleware и manager providers</summary>

Пример `AppModule` с `forRootAsync()` и ручным порядком middleware:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';
import { MainMiddleware } from './main.middleware';
import { SimpleScene } from './scene/simple.scene';

@Module({
  imports: [
    VkModule.forRootAsync({
      inject: [MainMiddleware],
      useFactory: async (mainMiddleware: MainMiddleware) => ({
        token: process.env.VK_BOT_TOKEN,
        options: {
          pollingGroupId: +process.env.VK_BOT_GROUP_ID,
          apiMode: 'sequential',
        },
        // launchOptions: false,
        // notReplyMessage: true,
        middlewaresBefore: [mainMiddleware.middlewaresBefore],
        middlewaresAfter: [mainMiddleware.middlewaresAfter],
      }),
    }),
  ],
  providers: [MainMiddleware, AppUpdate, SimpleScene],
  exports: [MainMiddleware],
})
export class AppModule {}
```

Основной middleware `main.middleware.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectVkHearManager, InjectVkSceneManager } from 'nestjs-vk';
import { Composer, Context, MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

@Injectable()
export class MainMiddleware {
  private readonly sessionManager: SessionManager;

  @InjectVkHearManager()
  private readonly hearManagerProvider: HearManager<MessageContext>;

  @InjectVkSceneManager()
  private readonly sceneManager: SceneManager;

  constructor() {
    this.sessionManager = new SessionManager({
      // ...
    });
  }

  get middlewaresBefore() {
    const composer = Composer.builder<Context>();

    composer.use(this.sessionManager.middleware);
    composer.use(this.sceneManager.middleware);

    return composer.compose();
  }

  get middlewaresAfter() {
    const composer = Composer.builder<Context>();

    composer.use(this.hearManagerProvider.middleware);

    return composer.compose();
  }
}
```

Manager providers можно инжектить в constructor:

```typescript
import {
  InjectVkHearManager,
  InjectVkSceneManager,
  InjectVkSessionManager,
} from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

export class AppUpdate {
  constructor(
    @InjectVkHearManager()
    private readonly hearManager: HearManager<MessageContext>,
    @InjectVkSessionManager()
    private readonly sessionManager: SessionManager,
    @InjectVkSceneManager()
    private readonly sceneManager: SceneManager,
  ) {}
}
```

</details>

<details>
<summary>Multi-bot и <code>vkName</code></summary>

Полный пример multi-bot приложения есть в
[`sample/02-multibots-app`](./sample/02-multibots-app).

В multi-bot приложениях передавайте `vkName` в inject decorators, чтобы получить
manager конкретного бота:

```typescript
export class AppUpdate {
  constructor(
    @InjectVkHearManager('firstBot')
    private readonly firstBotHearManager: HearManager<MessageContext>,
    @InjectVkHearManager('secondBot')
    private readonly secondBotHearManager: HearManager<MessageContext>,
  ) {}
}
```

Тот же `vkName` используется внутри модуля для `VkModule.forRoot()` /
`VkModule.forRootAsync()` и `VkModule.forManagers()`, поэтому настройки managers,
`include` и остановка VK API применяются к конкретному боту, а не к общему
default provider.

Важно: `vkName` в inject decorators должен совпадать с `vkName`, переданным в
`VkModule.forRoot()` / `VkModule.forRootAsync()`. Сам `@Update()` не выбирает
бота — update provider попадает в конкретного бота через `include`.

```typescript
VkModule.forRootAsync({
  vkName: 'firstBot',
  include: [CommonBotModule],
});

VkModule.forRootAsync({
  vkName: 'secondBot',
  include: [CommonBotModule, SecondBotModule],
});
```

В этом примере update providers из `CommonBotModule` будут зарегистрированы в
оба бота, а update providers из `SecondBotModule` — только во второго.

</details>

<details>
<summary>Расширенный пример update provider</summary>

Пример `app.update.ts` с несколькими типами обработчиков:

```typescript
import {
  Ctx,
  HearFallback,
  Hears,
  InjectVkApi,
  Message,
  OnMessageEvent,
  Update,
} from 'nestjs-vk';
import { MessageContext, MessageEventContext, VK } from 'vk-io';

import { AppService } from './app.service';
import { SIMPLE_SCENE } from './vk.constants';

@Update()
export class AppUpdate {
  public groupId: number;

  constructor(
    @InjectVkApi()
    private readonly vk: VK,
    private readonly appService: AppService,
  ) {}

  async onModuleInit() {
    try {
      const [group] = await this.vk.api.groups.getById({});
      this.groupId = group.id;
    } catch (err) {
      console.error(err);
    }
  }

  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Ctx() ctx: MessageContext) {
    await ctx.reply('Добро пожаловать');
  }

  @Hears('hi')
  async hearsHi(@Ctx() ctx: MessageContext) {
    return 'Привет';
  }

  @OnMessageEvent({ broadcastAction: 'queue' })
  async onQueueAction(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Очередь открыта' });
  }

  @OnMessageEvent(
    (payload) =>
      payload?.phrase === 'schedule-notification' ||
      Boolean(payload?.scheduleNotifAction),
  )
  async onScheduleNotification(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Уведомления открыты' });
  }

  @Hears(/scene( ?(?<state>[0-9]+))?$/i)
  async hearsScene(@Ctx() ctx: MessageContext) {
    const stateNumber = ((e) => (isNaN(Number(e)) ? null : Number(e)))(
      ctx.$match?.groups?.state,
    );
    ctx.scene.enter(SIMPLE_SCENE, { state: { stateNumber } });
  }

  @Hears(['/sub', 'subscriber'])
  async onSubscriberCommand(@Ctx() ctx: MessageContext) {
    const isSib = await this.vk.api.groups.isMember({
      group_id: String(this.groupId),
      user_id: ctx.senderId,
    });
    return isSib ? 'Отлично!' : 'Подписка не найдена';
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext, @Message('text') text: string) {
    if (text) {
      return this.appService.echo(text);
    } else if (ctx.hasAttachments('sticker')) {
      ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
      return;
    }

    return 'Что?..';
  }
}
```

`OnMessageEvent` регистрирует обработчик callback-событий `message_event`.
Объектное условие сопоставляется с `ctx.eventPayload`, а predicate получает
payload первым аргументом. Если условие не подходит, обработчик передаёт
управление следующему listener-у, поэтому guards и метод не вызываются.

</details>

<details>
<summary>Порядок регистрации и обработки</summary>

`@Update()` только помечает class как update provider. К конкретному боту class
попадает через `include` в `VkModule.forRoot()` / `VkModule.forRootAsync()`.

Во время `onModuleInit` middleware подключаются в таком порядке:

1. `middlewaresBefore`;
2. `SessionManager.middleware`, если `useSessionManager !== false`;
3. `SceneManager.middleware` и `SceneManager.middlewareIntercept`, если
   `useSceneManager !== false`;
4. listeners из `@Use()`, `@On()` и `@OnMessageEvent()`;
5. scenes из `@Scene()`;
6. `HearManager.middleware`, если `useHearManager !== false`;
7. `middlewaresAfter`.

Практически это означает:

- `@On()` / `@OnMessageEvent()` регистрируются на уровне `vk.updates` раньше,
  чем подключается `HearManager.middleware`, поэтому они отработают до
  `@Hears()`;
- порядок методов с `@On()` внутри class обычно не должен использоваться как
  бизнес-логика; если listener должен пропустить событие дальше, явно вызывайте
  `next()`;
- порядок `@Hears()` имеет значение, потому что обработчики добавляются в
  `HearManager` в порядке сканирования providers и методов;
- `@HearFallback()` вызывается средствами `HearManager`, когда подходящий
  `@Hears()` не обработал событие;
- `@AddStep()` без аргумента получает порядковый номер по порядку сканирования
  методов, а `@AddStep(10)` / `@AddStep(20)` задают явный порядок шагов;
- порядок `include` не сортирует modules: он только фильтрует, какие modules
  сканировать. Фактический порядок modules/providers берётся из Nest container.

Если порядок критичен, лучше задавать его явно: через `middlewaresBefore` /
`middlewaresAfter`, через явные номера `@AddStep(step)` или через один
координирующий listener, который сам вызывает `next()`.

</details>

<details>
<summary>Пример scene</summary>

Для простой scene создайте файл `simple.scene.ts` и добавьте несколько шагов:

```typescript
import { AddStep, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { IStepContext } from '@vk-io/scenes';

import { SIMPLE_SCENE } from './vk.constants';

@Scene(SIMPLE_SCENE)
export class SimpleScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: IStepContext) {
    const { stateNumber } = ctx.scene.state;
    await ctx.reply(
      `Привет! Это простая scene. Твой state number: ${stateNumber}.\n` +
        ` Пришли мне число, и я умножу его на 2.`,
    );
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: IStepContext) {
    await ctx.reply('Пока!');
  }

  // @Hears('exit')
  // async onHearsExit(@Ctx() ctx: IStepContext) {
  //   await ctx.scene.leave();
  // }

  @AddStep()
  async onAddStep(@Ctx() ctx: IStepContext) {
    let { stateNumber: number } = ctx.scene.state;

    if (!ctx.scene.step.firstTime) {
      number = Number(ctx.text);
    }

    if (ctx.scene.step.firstTime && number === null) {
      await ctx.reply('Пришли мне число.');
      return;
    }

    if (isNaN(number)) {
      await ctx.reply('Ошибка. Пришли мне число.');
      return;
    }

    await ctx.reply(`Твоё число, умноженное на 2: ${number * 2}.`);

    if (number > 20 && number % 2 === 0) {
      await ctx.scene.leave();
    }
  }
}
```

</details>
