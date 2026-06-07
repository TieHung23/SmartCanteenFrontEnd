import { useState, useEffect, DependencyList } from "react";

export interface WrappedResponse<T> {
  value: T;
  isSuccess?: boolean;
  message?: string;
}

export function useApiData<T>(
  apiFunc: () => Promise<T | WrappedResponse<T>>,
  deps: DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunc();

        if (isMounted) {
          if (result !== null && typeof result === "object" && "value" in result) {
            const wrappedResult = result as WrappedResponse<T>;

            setData(wrappedResult.value);
            setIsSuccess(wrappedResult.isSuccess ?? true);
            setMessage(wrappedResult.message ?? null);
          } else {
            setData(result as T);
            setIsSuccess(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Lỗi không xác định"));
          setIsSuccess(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, isSuccess, message };
}
