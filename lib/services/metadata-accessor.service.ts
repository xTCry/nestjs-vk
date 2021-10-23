import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VK_SCENE_METADATA, VK_LISTENERS_METADATA, VK_UPDATE_METADATA } from '../vk.constants';
import { ListenerMetadata } from '../interfaces';

@Injectable()
export class MetadataAccessorService {
  constructor(private readonly reflector: Reflector) {}

  isUpdate(target: Function): boolean {
    if (!target) return false;
    return !!this.reflector.get(VK_UPDATE_METADATA, target);
  }

  isScene(target: Function): boolean {
    if (!target) return false;
    return !!this.reflector.get(VK_SCENE_METADATA, target);
  }

  getListenerMetadata(target: Function): ListenerMetadata[] | undefined {
    return this.reflector.get(VK_LISTENERS_METADATA, target);
  }

  getSceneMetadata(target: Function): string | undefined {
    return this.reflector.get(VK_SCENE_METADATA, target);
  }
}
