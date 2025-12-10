import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseFetchOptions<T> {
    initialData?: T;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

interface UseFetchReturn<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export function useFetch<T>(
    fetchFn: () => Promise<T>,
    options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
    const [data, setData] = useState<T | null>(options.initialData || null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await fetchFn();
            setData(result);
            if (options.onSuccess) {
                options.onSuccess(result);
            }
        } catch (err) {
            const error = err as AxiosError;
            setError(error);
            if (options.onError) {
                options.onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn, options.onSuccess, options.onError]);

    useEffect(() => {
        fetchData();
    }, []);

    return {
        data,
        error,
        isLoading,
        refetch: fetchData,
    };
}