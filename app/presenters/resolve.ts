export async function resolve<T>(
  promise: Promise<T>,
  callbacks: {
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
    onFinally?: () => void;
  } = {},
): Promise<T | null> {
  try {
    const result = await promise;
    callbacks.onSuccess?.(result);
    return result;
  } catch (error) {
    callbacks.onError?.(error);
  } finally {
    callbacks.onFinally?.();
  }
  return null;
}
