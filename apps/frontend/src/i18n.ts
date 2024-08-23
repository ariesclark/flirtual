// file generated by the Paraglide-Next init command
import {
	Navigation,
	Middleware,
	DetectionStrategy
} from "@inlang/paraglide-next";

import type { AvailableLanguageTag } from "~/paraglide/runtime";

const strategy = DetectionStrategy<AvailableLanguageTag>();

export const middleware = Middleware({ strategy });
export const { Link, useRouter, usePathname, redirect, permanentRedirect } =
	Navigation({ strategy });
