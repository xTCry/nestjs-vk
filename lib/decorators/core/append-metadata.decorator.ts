export type CustomDecorator<TKey = string> = MethodDecorator &
  ClassDecorator & { KEY: TKey };

type MetadataTarget = object | Function;
type DecoratedDescriptor = TypedPropertyDescriptor<Function>;

export const AppendMetadata = <K = string, V = unknown>(
  metadataKey: K,
  metadataValue: V,
) => {
  const decoratorFactory = (
    target: MetadataTarget,
    _key?: string | symbol,
    descriptor?: DecoratedDescriptor,
  ) => {
    if (descriptor?.value) {
      const previousValue =
        Reflect.getMetadata(metadataKey, descriptor.value) || [];
      const value = [...previousValue, metadataValue];
      Reflect.defineMetadata(metadataKey, value, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(metadataKey, metadataValue, target);
    return target;
  };

  decoratorFactory.KEY = metadataKey;
  return decoratorFactory as CustomDecorator<K>;
};
