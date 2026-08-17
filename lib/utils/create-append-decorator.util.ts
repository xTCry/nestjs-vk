import { uid } from 'uid';

import {
  AppendMetadata,
  CustomDecorator,
} from '../decorators/core/append-metadata.decorator';

export interface CreateDecoratorOptions<
  TParam = unknown,
  TTransformed = TParam,
> {
  /**
   * The key for the metadata.
   * @default uid(21)
   */
  key?: string;

  /**
   * The transform function to apply to the metadata value.
   * @default value => value
   */
  transform?: (value: TParam) => TTransformed;
}

type CreateDecoratorWithTransformOptions<
  TParam,
  TTransformed = TParam,
> = CreateDecoratorOptions<TParam, TTransformed> &
  Required<Pick<CreateDecoratorOptions<TParam, TTransformed>, 'transform'>>;

export type ReflectableDecorator<TParam, TTransformed = TParam> = ((
  opts?: TParam,
) => CustomDecorator) & { KEY: string };

export function createAppendDecorator<TParam>(
  options?: CreateDecoratorOptions<TParam>,
): ReflectableDecorator<TParam, TParam>;
export function createAppendDecorator<TParam, TTransformed>(
  options: CreateDecoratorWithTransformOptions<TParam, TTransformed>,
): ReflectableDecorator<TParam, TTransformed>;
export function createAppendDecorator<TParam, TTransformed = TParam>(
  options: CreateDecoratorOptions<TParam, TTransformed> = {},
): ReflectableDecorator<TParam, TTransformed> {
  const metadataKey = options.key ?? uid(21);
  const decoratorFn =
    (metadataValue: TParam) =>
    (
      target: object | Function,
      key?: string | symbol,
      descriptor?: TypedPropertyDescriptor<Function>,
    ) => {
      if (key === undefined) {
        return;
      }

      const value = options.transform
        ? options.transform(metadataValue)
        : metadataValue;
      const decorator = AppendMetadata(metadataKey, value ?? {});

      return descriptor
        ? decorator(target, key, descriptor)
        : decorator(target as Function);
    };

  decoratorFn.KEY = metadataKey;
  return decoratorFn as ReflectableDecorator<TParam, TTransformed>;
}
