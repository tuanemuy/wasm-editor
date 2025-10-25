/**
 * Wrapper function for handling async operations with callbacks
 *
 * This function provides a consistent way to handle success, error, and cleanup
 * without requiring repetitive try-catch blocks at every call site.
 *
 * @param promise - The async operation to execute
 * @param callbacks - Optional callbacks for success, error, and cleanup
 * @returns The result of the promise
 * @throws Re-throws the error after calling onError callback if one occurs
 *
 * @example
 * // With error handling via callback
 * await request(updateNote(...), {
 *   onSuccess: () => console.log('Updated!'),
 *   onError: (error) => showToast(error),
 *   onFinally: () => setLoading(false)
 * });
 *
 * // Can also wrap in try-catch if needed
 * try {
 *   const result = await request(getNote(...));
 *   // use result
 * } catch (error) {
 *   // handle error
 * }
 */
export async function request<T>(
  promise: Promise<T>,
  callbacks: {
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
    onFinally?: () => void;
  } = {},
): Promise<T> {
  try {
    const result = await promise;
    callbacks.onSuccess?.(result);
    return result;
  } catch (error) {
    callbacks.onError?.(error);
    throw error; // Re-throw after calling callback
  } finally {
    callbacks.onFinally?.();
  }
}
