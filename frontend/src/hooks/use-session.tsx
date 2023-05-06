import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { Session } from "~/api/auth";
import { User } from "~/api/user";
import { urls } from "~/urls";

export type UseSessionOptions = Omit<SWRConfiguration<Session | null>, "fetcher" | "fallbackData">;

export function useSession(options: UseSessionOptions = {}) {
	const router = useRouter();
	const { data: session = null, mutate } = useSWR(
		"session",
		() => api.auth.session().catch(() => null),
		options
	);

	//console.log({ session: session?.user.id });

	const update = useCallback(
		async (session?: Session | null, refresh: boolean = true) => {
			await mutate(session, { revalidate: false });
			if (refresh) router.refresh();
		},
		[mutate, router]
	);

	const logout = useCallback(async () => {
		await api.auth.logout().catch(() => null);
		router.push(urls.login());
	}, [router]);

	return [session, update, logout] as const;
}

export function useSessionUser(options: UseSessionOptions = {}): User | null {
	const [session] = useSession(options);
	return session?.user ?? null;
}
