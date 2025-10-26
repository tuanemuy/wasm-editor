import { describe, expect, it, vi } from "vitest";
import { request } from "./request";

describe("request", () => {
  describe("success cases", () => {
    it("should return result on success", async () => {
      const result = await request(Promise.resolve("success"));
      expect(result).toBe("success");
    });

    it("should call onSuccess callback with result", async () => {
      const onSuccess = vi.fn();
      const result = await request(Promise.resolve("success"), { onSuccess });

      expect(result).toBe("success");
      expect(onSuccess).toHaveBeenCalledWith("success");
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should call onFinally callback on success", async () => {
      const onFinally = vi.fn();
      await request(Promise.resolve("success"), { onFinally });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it("should call both onSuccess and onFinally in correct order", async () => {
      const calls: string[] = [];
      const onSuccess = vi.fn(() => calls.push("success"));
      const onFinally = vi.fn(() => calls.push("finally"));

      await request(Promise.resolve("test"), { onSuccess, onFinally });

      expect(calls).toEqual(["success", "finally"]);
    });
  });

  describe("error cases", () => {
    it("should return null on error", async () => {
      const result = await request(Promise.reject(new Error("fail")));
      expect(result).toBeNull();
    });

    it("should call onError callback with error", async () => {
      const onError = vi.fn();
      const error = new Error("fail");

      const result = await request(Promise.reject(error), { onError });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should call onFinally callback on error", async () => {
      const onFinally = vi.fn();
      await request(Promise.reject(new Error("fail")), { onFinally });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it("should call both onError and onFinally in correct order", async () => {
      const calls: string[] = [];
      const onError = vi.fn(() => calls.push("error"));
      const onFinally = vi.fn(() => calls.push("finally"));

      await request(Promise.reject(new Error("fail")), { onError, onFinally });

      expect(calls).toEqual(["error", "finally"]);
    });

    it("should not call onSuccess on error", async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      await request(Promise.reject(new Error("fail")), { onSuccess, onError });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("callback combinations", () => {
    it("should work with no callbacks", async () => {
      const result = await request(Promise.resolve("success"));
      expect(result).toBe("success");
    });

    it("should work with only onSuccess", async () => {
      const onSuccess = vi.fn();
      const result = await request(Promise.resolve("success"), { onSuccess });

      expect(result).toBe("success");
      expect(onSuccess).toHaveBeenCalledWith("success");
    });

    it("should work with only onError", async () => {
      const onError = vi.fn();
      const result = await request(Promise.reject(new Error("fail")), {
        onError,
      });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalled();
    });

    it("should work with only onFinally", async () => {
      const onFinally = vi.fn();
      const result = await request(Promise.resolve("success"), { onFinally });

      expect(result).toBe("success");
      expect(onFinally).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle non-Error objects", async () => {
      const onError = vi.fn();
      const result = await request(Promise.reject("string error"), { onError });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith("string error");
    });

    it("should handle undefined rejection", async () => {
      const onError = vi.fn();
      const result = await request(Promise.reject(undefined), { onError });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith(undefined);
    });

    it("should swallow errors from onSuccess callback and return result", async () => {
      const onSuccess = vi.fn(() => {
        throw new Error("callback error");
      });

      // Callback errors are caught and ignored - the promise result is still returned
      const result = await request(Promise.resolve("success"), { onSuccess });
      expect(result).toBe("success");
      expect(onSuccess).toHaveBeenCalled(); // Verify callback was invoked
    });
  });

  describe("type safety", () => {
    it("should preserve result type", async () => {
      type TestType = { id: number; name: string };
      const testData: TestType = { id: 1, name: "test" };

      const result = await request(Promise.resolve(testData));

      expect(result).toEqual(testData);
      // TypeScript should infer result as TestType | null
      if (result) {
        expect(result.id).toBe(1);
        expect(result.name).toBe("test");
      }
    });
  });
});
