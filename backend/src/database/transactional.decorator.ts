import { TransactionManager } from './transaction-manager';

/**
 * Runs the decorated async method inside a database transaction
 * (the equivalent of Spring's @Transactional). If any error is thrown,
 * every write made through repositories during the call is rolled back.
 */
export function Transactional(): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = function transactionalMethod(this: unknown, ...args: unknown[]) {
      return TransactionManager.current().run(() => original.apply(this, args));
    };
    return descriptor;
  };
}
