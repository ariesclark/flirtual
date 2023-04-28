import { useCallback, useEffect } from "react";

import { displayName } from "~/api/user";
import { urls } from "~/urls";
import { resolveTheme } from "~/theme";

import { useSessionUser } from "./use-session";
import { useTheme } from "./use-theme";

declare global {
	interface Window {
		Canny: {
			(...args: Array<unknown>): void;
			q: Array<unknown>;
		};
	}
}

const appId = "640785c1023e50169ab5c94a";

let loaded = false;

export function useCanny() {
	const user = useSessionUser();
	const { sessionTheme } = useTheme();

	const loadCanny = useCallback(() => {
		if (loaded) return;

		const script = document.createElement("script");
		script.src = "https://canny.io/sdk.js";
		script.id = "canny-jssdk";
		script.async = true;

		document.body.appendChild(script);
		loaded = true;
	}, []);

	useEffect(() => {
		if (typeof window.Canny !== "function") {
			window.Canny = Object.assign(
				function () {
					// eslint-disable-next-line prefer-rest-params
					window.Canny.q.push(arguments);
				},
				{ q: [] }
			);
		}
	}, []);

	const identifyUser = useCallback(
		(callback?: () => void) => {
			if (user) {
				window.Canny(
					"identify",
					{
						appID: appId,
						user: {
							email: user.email,
							name: displayName(user),
							id: user.id,
							avatarURL: urls.userAvatar(user)
						}
					},
					callback
				);
			} else if (callback) {
				callback();
			}
		},
		[user]
	);

	const openFeedback = useCallback(() => {
		loadCanny();
		identifyUser(() => {
			window.location.href = urls.resources.feedback;
		});
	}, [identifyUser, loadCanny]);

	const loadChangelog = useCallback(() => {
		loadCanny();
		identifyUser();
		window.Canny("initChangelog", {
			appID: appId,
			position: "bottom",
			align: "left",
			theme: resolveTheme(sessionTheme)
		});
	}, [identifyUser, loadCanny, sessionTheme]);

	return { openFeedback, loadChangelog };
}
