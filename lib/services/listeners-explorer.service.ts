import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Module } from '@nestjs/core/injector/module';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { VK, Context, Updates, MessageContext, Composer } from 'vk-io';
import { AllowArray } from 'vk-io/lib/types';
import { NextMiddleware } from 'middleware-io';
import { SessionManager } from '@vk-io/session';
import { SceneManager, StepScene } from '@vk-io/scenes';
import { HearManager } from '@vk-io/hear';

import { MetadataAccessorService } from './metadata-accessor.service';
import {
  PARAM_ARGS_METADATA,
  VK_API_NAME,
  VK_MODULE_OPTIONS,
  VK_SESSION_MANAGER,
  VK_SCENE_MANAGER,
  VK_HEAR_MANAGER,
} from '../vk.constants';
import { BaseExplorerService } from './base-explorer.service';
import { VkParamsFactory } from '../factories/vk-params-factory';
import { VkontextType } from '../execution-context';
import { VkModuleOptions } from '../interfaces';

@Injectable()
export class ListenersExplorerService extends BaseExplorerService implements OnModuleInit {
  private readonly vkParamsFactory = new VkParamsFactory();
  private vk: VK;

  constructor(
    @Inject(VK_HEAR_MANAGER)
    private readonly hearManagerProvider: HearManager<MessageContext>,
    @Inject(VK_SESSION_MANAGER)
    private readonly sessionManagerProvider: SessionManager,
    @Inject(VK_SCENE_MANAGER)
    private readonly sceneManager: SceneManager,
    @Inject(VK_MODULE_OPTIONS)
    private readonly vkOptions: VkModuleOptions,
    @Inject(VK_API_NAME)
    private readonly vkName: string,

    private readonly moduleRef: ModuleRef,
    private readonly metadataAccessor: MetadataAccessorService,
    private readonly metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {
    super();
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

    if (this.vkOptions.useSessionManager !== false) {
      this.vk.updates.use(this.sessionManagerProvider.middleware);
    }

    if (this.vkOptions.useSceneManager !== false) {
      this.vk.updates.use(this.sceneManager.middleware);
      this.vk.updates.use(this.sceneManager.middlewareIntercept);
    }

    this.explore();

    if (this.vkOptions.useHearManager !== false) {
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
    const modules = this.getModules(this.modulesContainer, this.vkOptions.include || []);

    this.registerUpdates(modules);
    this.registerScenes(modules);
  }

  private registerUpdates(modules: Module[]): void {
    const updates = this.flatMap<InstanceWrapper>(modules, (instance) => this.filterUpdates(instance));
    updates.forEach((wrapper) => this.registerListeners(this.vk.updates, wrapper));
  }

  private filterUpdates(wrapper: InstanceWrapper): InstanceWrapper<unknown> {
    const { instance } = wrapper;
    if (!instance) return undefined;

    const isUpdate = this.metadataAccessor.isUpdate(wrapper.metatype);
    if (!isUpdate) return undefined;

    return wrapper;
  }

  private registerScenes(modules: Module[]): void {
    const scenes = this.flatMap<InstanceWrapper>(modules, (wrapper) => this.filterScenes(wrapper));
    scenes.forEach((wrapper) => {
      const sceneId = this.metadataAccessor.getSceneMetadata(wrapper.instance.constructor);

      this.registerSceneSteps(sceneId, wrapper);
    });
  }

  private filterScenes(wrapper: InstanceWrapper): InstanceWrapper<unknown> {
    const { instance } = wrapper;
    if (!instance) return undefined;

    const isScene = this.metadataAccessor.isScene(wrapper.metatype);
    if (!isScene) return undefined;

    return wrapper;
  }

  private registerListeners(updates: Updates, wrapper: InstanceWrapper<unknown>): void {
    const { instance } = wrapper;
    const prototype = Object.getPrototypeOf(instance);
    this.metadataScanner.scanFromPrototype(instance, prototype, (name) =>
      this.registerIfListener(updates, instance, prototype, name),
    );
  }

  private registerSceneSteps(sceneId: string, wrapper: InstanceWrapper<any>): void {
    const { instance } = wrapper;
    const prototype = Object.getPrototypeOf(instance);

    const steps: { step: number; methodName: string }[] = [];

    let enterHandler;
    let leaveHandler;

    let index = 0;
    this.metadataScanner.scanFromPrototype(instance, prototype, (methodName) => {
      const methodRef = prototype[methodName];
      const action = this.metadataAccessor.getSceneActionMetadata(methodRef);
      if (action) {
        if (action === 'enter') {
          enterHandler = this.createContextCallback(instance, prototype, methodName);
        } else {
          leaveHandler = this.createContextCallback(instance, prototype, methodName);
        }
        return;
      }
      const step = this.metadataAccessor.getSceneStepMetadata(methodRef);
      steps.push({ step: step ?? index++, methodName });
    });

    const scene = new StepScene(sceneId, {
      enterHandler,
      leaveHandler,
      steps: steps
        .sort((a, b) => a.step - b.step)
        .map((e) => {
          const listenerCallbackFn = this.createContextCallback(instance, prototype, e.methodName);
          return listenerCallbackFn;
        }),
    });
    this.sceneManager.addScenes([scene]);
  }

  private registerIfListener(updates: Updates, instance: any, prototype: any, methodName: string): void {
    const methodRef = prototype[methodName];
    const metadata = this.metadataAccessor.getListenerMetadata(methodRef);
    if (!metadata || metadata.length < 1) {
      return undefined;
    }

    const listenerCallbackFn = this.createContextCallback(instance, prototype, methodName);

    for (const { handlerType, method, event, args } of metadata) {
      const getHandler =
        () =>
        async (ctx: Context, next: NextMiddleware): Promise<void> => {
          const result = await listenerCallbackFn(ctx, next);
          if (result) {
            switch (true) {
              case ctx.is(['message']): {
                if (typeof result === 'string' || typeof result === 'object') {
                  if (this.vkOptions.notReplyMessage) {
                    await ctx.send(result);
                  } else {
                    await ctx.reply(result);
                  }
                }
                break;
              }
            }
          }
          // TODO-Possible-Feature: Add more supported return types
        };

      switch (handlerType) {
        case 'vk_updates': {
          updates[method](event, [...args, getHandler()] as AllowArray<any>);
          break;
        }
        case 'hears': {
          // if (this.vkOptions.useHearManager === false) {
          //   break;
          // }

          if (method === 'onFallback') {
            this.hearManagerProvider.onFallback(getHandler());
          } else {
            // @ts-ignore
            this.hearManagerProvider.hear(event, ...[...args, getHandler()]);
          }
          break;
        }
        // TODO: remake it (support hearManager, etc)
      }
    }
  }

  createContextCallback<T extends Record<string, unknown>>(instance: T, prototype: unknown, methodName: string) {
    const paramsFactory = this.vkParamsFactory;
    const resolverCallback = this.externalContextCreator.create<Record<number, ParamMetadata>, VkontextType>(
      instance,
      prototype[methodName],
      methodName,
      PARAM_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      undefined,
      'vk-io',
    );
    return resolverCallback;
  }
}
