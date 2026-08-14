export type CustomDecorator<TKey = string> = MethodDecorator &
  ClassDecorator & { KEY: TKey };

export const AppendMetadata = <K = string, V = any>(
  metadataKey: K,
  metadataValue: V,
) => {
  const decoratorFactory = (
    target: object,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
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
