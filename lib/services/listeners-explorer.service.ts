import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { ModuleRef, ModulesContainer, Reflector } from '@nestjs/core';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Middleware as MiddlewareFn } from 'middleware-io';
import { Composer, Context, MessageContext, Updates, VK } from 'vk-io';
import { AllowArray } from 'vk-io/lib/types';
import { HearManager } from '@vk-io/hear';
import { SceneManager, StepScene } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

import { Scene, VkReplyOptions, VkUpdate } from '../decorators';
import { AddStep, SceneEnter, SceneLeave } from '../decorators/scene';
import { VkContextType, VkParamsFactory } from '../execution-context';
import {
  IVkReplyOptions,
  ListenerMetadata,
  VkManagersOptions,
  VkModuleOptions,
} from '../interfaces';
import type { VkHearsCondition } from '../types';
import {
  applyListenerResult,
  ListenerDecorator,
  matchMessageEventPayload,
} from '../utils';
import {
  PARAM_ARGS_METADATA,
  VK_API_NAME,
  VK_HEAR_MANAGER,
  VK_MANAGERS_OPTIONS,
  VK_MODULE_OPTIONS,
  VK_SCENE_MANAGER,
  VK_SESSION_MANAGER,
} from '../vk.constants';

@Injectable()
export class ListenersExplorerService implements OnModuleInit {
  private readonly vkParamsFactory = new VkParamsFactory();
  private vk: VK;

  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
    private readonly metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly externalContextCreator: ExternalContextCreator,

    @Optional()
    @Inject(VK_HEAR_MANAGER)
    private readonly hearManagerProvider: HearManager<MessageContext>,
    @Optional()
    @Inject(VK_SESSION_MANAGER)
    private readonly sessionManagerProvider: SessionManager,
    @Optional()
    @Inject(VK_SCENE_MANAGER)
    private readonly sceneManager: SceneManager,
    @Inject(VK_MODULE_OPTIONS)
    private readonly vkOptions: VkModuleOptions,
    @Optional()
    @Inject(VK_MANAGERS_OPTIONS)
    private readonly vkManagersOptions: VkManagersOptions | undefined,
    @Inject(VK_API_NAME)
    private readonly vkName: string,
  ) {
    this.vkManagersOptions ??= {};
    this.hearManagerProvider ??= new HearManager();
    this.sessionManagerProvider ??= new SessionManager();
    this.sceneManager ??= new SceneManager();
  }

  onModuleInit(): void {
    this.vk = this.moduleRef.get<VK>(this.vkName, { strict: false });

    if (this.vkOptions.middlewaresBefore) {
      const composer = Composer.builder();
      for (const middleware of this.vkOptions.middlewaresBefore) {
        composer.use(middleware);
      }
      this.vk.updates.use(composer.compose());
    }

    if (this.vkManagersOptions.useSessionManager !== false) {
      this.vk.updates.use(this.sessionManagerProvider.middleware);
    }

    if (this.vkManagersOptions.useSceneManager !== false) {
      this.vk.updates.use(this.sceneManager.middleware);
      this.vk.updates.use(this.sceneManager.middlewareIntercept);
    }

    this.explore();

    if (this.vkManagersOptions.useHearManager !== false) {
      this.vk.updates.use(this.hearManagerProvider.middleware);
    }

    if (this.vkOptions.middlewaresAfter) {
      const composer = Composer.builder();
      for (const middleware of this.vkOptions.middlewaresAfter) {
        composer.use(middleware);
      }
      this.vk.updates.use(composer.compose());
    }
  }

  explore(): void {
    const modules = this.getModules(
      this.modulesContainer,
      this.vkOptions.include || [],
    );

    this.registerUpdates(modules);
    this.registerScenes(modules);
  }

  getModules(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    if (!include || include.length === 0) {
      return [...modulesContainer.values()];
    }
    const whitelisted = this.includeWhitelisted(modulesContainer, include);
    return whitelisted;
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    const modules = [...modulesContainer.values()];
    return modules.filter(({ metatype }) => include.includes(metatype));
  }

  private registerUpdates(modules: Module[]): void {
    const updates = this.flatMap(modules, (wrapper) =>
      this.filterByReflectDecorator(wrapper, VkUpdate),
    );
    for (const wrapper of updates) {
      this.registerListeners(this.vk.updates, wrapper);
    }
  }

  flatMap<T>(
    modules: Module[],
    callback: (wrapper: InstanceWrapper, moduleRef: Module) => T | T[],
  ) {
    return modules
      .map((moduleRef) =>
        [...moduleRef.providers.values()].map((wrapper) =>
          callback(wrapper, moduleRef),
        ),
      )
      .flat(Infinity)
      .filter(Boolean) as NonNullable<T>[];
  }

  private filterByReflectDecorator<MT extends Function & { KEY: string }>(
    wrapper: InstanceWrapper,
    decorator: MT,
  ): InstanceWrapper<unknown> | undefined {
    const { instance } = wrapper;
    if (!instance || !wrapper.metatype) return undefined;

    const isSet = this.reflector.get(decorator, wrapper.metatype);
    if (!isSet) return undefined;

    return wrapper;
  }

  private registerScenes(modules: Module[]): void {
    const scenes = this.flatMap<InstanceWrapper>(modules, (wrapper) =>
      this.filterByReflectDecorator(wrapper, Scene),
    );
    for (const wrapper of scenes) {
      const sceneId = this.reflector.get<string | undefined>(
        Scene,
        wrapper.instance.constructor,
      );

      this.registerSceneSteps(sceneId, wrapper);
    }
  }

  private registerListeners(
    updates: Updates,
    wrapper: InstanceWrapper<unknown>,
  ): void {
    const { instance } = wrapper;
    const prototype = Object.getPrototypeOf(instance);

    const methodNames = this.metadataScanner.getAllMethodNames(prototype);
    for (const methodName of methodNames) {
      this.registerIfListener(updates, instance, prototype, methodName);
    }
  }

  private registerSceneSteps(
    sceneId: string,
    wrapper: InstanceWrapper<any>,
  ): void {
    const { instance } = wrapper;
    const prototype = Object.getPrototypeOf(instance);

    const steps: { step: number; methodName: string }[] = [];

    let enterHandler;
    let leaveHandler;

    let index = 0;
    const methodNames = this.metadataScanner.getAllMethodNames(prototype);
    for (const methodName of methodNames) {
      const methodRef = prototype[methodName];
      if (this.reflector.get(SceneEnter, methodRef)) {
        enterHandler = this.createContextCallback(instance, methodName);
        continue;
      }

      if (this.reflector.get(SceneLeave, methodRef)) {
        leaveHandler = this.createContextCallback(instance, methodName);
        continue;
      }

      const step = this.reflector.get<number | undefined>(AddStep, methodRef);
      steps.push({ step: step ?? index++, methodName });
    }
    const scene = new StepScene(sceneId, {
      enterHandler,
      leaveHandler,
      steps: steps
        .sort((a, b) => a.step - b.step)
        .map((e) => {
          const listenerCallbackFn = this.createContextCallback(
            instance,
            e.methodName,
          );
          return listenerCallbackFn;
        }),
    });
    this.sceneManager.addScenes([scene]);
  }

  private getListenerMetadata(
    methodRef: any,
    defaultMetadata?: ListenerMetadata[],
  ): ListenerMetadata[] | undefined {
    return this.reflector.get(ListenerDecorator, methodRef) || defaultMetadata;
  }

  private getMergedReplyOptions(
    instance: any,
    methodRef: any,
  ): IVkReplyOptions {
    const replyOptionsAll = this.reflector.getAllAndMerge<IVkReplyOptions>(
      VkReplyOptions,
      [instance.constructor, methodRef],
    );
    return { ...this.vkOptions.replyOptions, ...replyOptionsAll };
  }

  private registerIfListener(
    updates: Updates,
    instance: any,
    prototype: any,
    methodName: string,
    defaultMetadata?: ListenerMetadata[],
  ): void {
    const methodRef = prototype[methodName];
    const metadata = this.getListenerMetadata(methodRef, defaultMetadata);
    const replyOptions = this.getMergedReplyOptions(instance, methodRef);
    if (!metadata || metadata.length === 0) {
      return undefined;
    }

    type MwFn = MiddlewareFn<Context> & { displayName: string };
    const listenerCallbackFn = this.createContextCallback(
      instance,
      methodName,
    ) as MwFn | undefined;

    replyOptions.replyTo ??= !this.vkOptions.notReplyMessage;

    for (const { handlerType, method, event, args } of metadata) {
      const fn: MwFn = async (ctx, next) => {
        const result = await listenerCallbackFn(ctx, next);
        await applyListenerResult(ctx, result, replyOptions);
      };
      fn.displayName = methodName;

      switch (handlerType) {
        case 'vk_updates': {
          if (method === 'use') {
            updates.use(fn);
          } else {
            const updateEvent = event;
            (
              updates[method] as (
                event: typeof updateEvent,
                handlers: AllowArray<typeof fn>,
              ) => Updates
            )(updateEvent, [...args, fn] as AllowArray<typeof fn>);
          }
          break;
        }
        case 'hears': {
          if (method === 'onFallback') {
            this.hearManagerProvider.onFallback(fn);
          } else {
            (
              this.hearManagerProvider.hear as (
                event: VkHearsCondition,
                ...handlers: MiddlewareFn<MessageContext>[]
              ) => HearManager<MessageContext>
            )(
              event as VkHearsCondition,
              ...(args as MiddlewareFn<MessageContext>[]),
              fn,
            );
          }
          break;
        }
        case 'message_event': {
          updates.on('message_event', async (ctx, next) => {
            if (!matchMessageEventPayload(ctx.eventPayload, event, ctx)) {
              return next();
            }

            return fn(ctx, next);
          });
          break;
        }
        // TODO: remake it (support hearManager, etc)
      }
    }
  }

  private createContextCallback(instance: any, methodName: string) {
    if (!instance || typeof instance[methodName] !== 'function') {
      return;
    }

    const prototype = Object.getPrototypeOf(instance);
    if (!prototype || !prototype[methodName]) {
      return;
    }

    return this.externalContextCreator.create<
      Record<number, ParamMetadata>,
      VkContextType
    >(
      instance,
      prototype[methodName],
      methodName,
      PARAM_ARGS_METADATA,
      this.vkParamsFactory,
      undefined,
      undefined,
      { guards: true, filters: true, interceptors: true },
      'vk-io',
    );
  }
}
