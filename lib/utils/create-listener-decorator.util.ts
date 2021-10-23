import { VK_LISTENERS_METADATA } from '../vk.constants';
import { ListenerMetadata } from '../interfaces';
import { HandlerType } from '../types';

export function createListenerDecorator<E = any, A = any>(handlerType: HandlerType, method?: string) {
  return (event?: E, ...args: A[]): MethodDecorator => {
    return (_target: any, _key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
      const metadata: ListenerMetadata[] = [
        {
          handlerType,
          method,
          event,
          args,
        },
      ];

      const previousValue = Reflect.getMetadata(VK_LISTENERS_METADATA, descriptor.value) || [];
      const value = [...previousValue, ...metadata];
      Reflect.defineMetadata(VK_LISTENERS_METADATA, value, descriptor.value);
      return descriptor;
    };
  };
}
