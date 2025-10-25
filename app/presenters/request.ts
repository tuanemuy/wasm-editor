/**
 * Wrapper function for handling async operations with callbacks
 *
 * This function provides a consistent way to handle success, error, and cleanup
 * without requiring repetitive try-catch blocks at every call site.
 *
 * The primary purpose of this function is to reduce boilerplate error handling.
 * Errors are handled entirely through the onError callback and do not propagate
 * to the caller, avoiding the need for try-catch blocks.
 *
 * @param promise - The async operation to execute
 * @param callbacks - Optional callbacks for success, error, and cleanup
 * @returns The result of the promise on success, or null if an error occurs
 *
 * @example
 * // Handle success and errors via callbacks only
 * const note = await request(createNote(...), {
 *   onSuccess: () => console.log('Created!'),
 *   onError: (error) => showToast(error),
 *   onFinally: () => setLoading(false)
 * });
 *
 * if (note) {
 *   // Use the note
 * }
 *
 * @example
 * // With state updates
 * await request(updateNote(...), {
 *   onSuccess: () => setSaveStatus('saved'),
 *   onError: (error) => {
 *     setSaveStatus('error');
 *     showError(error);
 *   }
 * });
 */
export async function request<T>(
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
    return null;
  } finally {
    callbacks.onFinally?.();
  }
}
