import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect } from "react";
import { getLoginUrl } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const {
    redirectOnUnauthenticated = false,
    redirectPath,
  } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const user = meQuery.data ?? null;
  const loading = meQuery.isLoading || logoutMutation.isPending;
  const error = meQuery.error ?? logoutMutation.error ?? null;

  useEffect(() => {
    if (!redirectOnUnauthenticated || meQuery.isLoading || logoutMutation.isPending) {
      return;
    }
    if (user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    window.location.href = redirectPath ?? getLoginUrl();
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    user,
  ]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
