"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";
import { useMemo } from "react";

import { IconComponent } from "~/components/icons";
import { HeartGradient } from "~/components/icons/heart-gradient";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";
import { User } from "~/api/user";
import { useCurrentUser } from "~/hooks/use-current-user";
import { Html } from "~/components/html";
import { useCountryList } from "~/hooks/use-country-list";

import { ProfileImageDisplay } from "./profile-image-display";

const Pill: React.FC<React.ComponentProps<"div"> & { Icon?: IconComponent; active?: boolean }> = ({
	Icon,
	active = false,
	...props
}) => (
	<div
		{...props}
		className={twMerge(
			"flex h-8 select-none items-center gap-2 rounded-xl py-1 px-4 font-montserrat font-semibold shadow-brand-1",
			active
				? "bg-brand-gradient text-white-10"
				: "bg-white-30 text-black-70 dark:bg-black-70 dark:text-white-20 sm:dark:bg-black-60",
			props.className
		)}
	>
		{Icon && <Icon className="h-4" />}
		{props.children}
	</div>
);

const ONE_DAY_IN_MILLISECONDS = 8.64e7;
const TWO_WEEKS_IN_MILLISECONDS = 1.21e9;

const ActivityIndicator: React.FC<{ lastActiveAt: Date }> = ({ lastActiveAt }) => {
	const timeSince = Date.now() - lastActiveAt.getTime();

	const color =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "bg-green-500"
				: "bg-yellow-500"
			: "bg-black-70";
	const text =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "Active today"
				: "Active recently"
			: "Offline";

	if (text.includes("Offline")) return null;

	return (
		<div className="flex items-center gap-2">
			<div className={twMerge("h-4 w-4 rounded-full", color)}>
				<div className={twMerge("h-4 w-4 animate-ping rounded-full", color)} />
			</div>
			<span className="select-none font-montserrat font-semibold">{text}</span>
		</div>
	);
};

const ProfileVerificationBadge: React.FC = () => (
	<div className="relative h-6 w-6">
		<div className="absolute top-1/4 left-1/4 h-3 w-3 bg-white-20" />
		<CheckBadgeIcon className="absolute h-full w-full fill-pink" />
	</div>
);

const CountryPill: React.FC<{ code: string }> = ({ code }) => {
	const countries = useCountryList();

	const country = useMemo(
		() => countries.find((country) => country.id === code),
		[countries, code]
	);

	if (!country) return null;

	return (
		<Pill>
			<img className="-ml-4 h-8 shrink-0 rounded-l-lg" src={country.metadata.flagUrl} />
			<span>{country.name}</span>
		</Pill>
	);
};

function getPersonalityLabels({ profile: { openness, conscientiousness, agreeableness } }: User) {
	if (!openness || !conscientiousness || !agreeableness) return [];

	return [
		openness > 0 ? "Open-minded" : "Practical",
		conscientiousness > 0 ? "Reliable" : "Free-spirited",
		agreeableness > 0 ? "Friendly" : "Straightforward"
	];
}

const PillCollection: React.FC<{ user: User }> = (props) => {
	const { data: currentUser } = useCurrentUser();
	const { user } = props;

	if (!currentUser) return null;

	const myPersonalityLabels = getPersonalityLabels(currentUser);
	const personalityLabels = getPersonalityLabels(user);

	return (
		<div className="flex flex-wrap gap-2">
			{user.profile.serious && <Pill>Open to serious dating</Pill>}
			{personalityLabels.map((personalityLabel) => (
				<Pill active={myPersonalityLabels.includes(personalityLabel)} key={personalityLabel}>
					{personalityLabel}
				</Pill>
			))}
			{user.profile.games.map((game) => (
				<Pill
					active={currentUser.profile.games.some((attribute) => attribute.id === game.id)}
					key={game.id}
				>
					{game.name}
				</Pill>
			))}
			{user.profile.interests.map((interest) => (
				<Pill key={interest.id}>{interest.name}</Pill>
			))}
		</div>
	);
};

export const Profile: React.FC<{ username: string }> = ({ username }) => {
	const { data: user } = useUser({ username });
	if (!user) return null;

	return (
		<div className="flex w-full flex-col overflow-hidden border-coral bg-cream text-black-70 dark:bg-black-80 dark:text-white-20 sm:max-w-lg sm:rounded-3xl sm:border-4 sm:bg-white-20 sm:shadow-brand-1 sm:dark:bg-black-70">
			<ProfileImageDisplay
				images={user.profile.images.map((image) => urls.media(image.externalId))}
			>
				<div className="absolute bottom-0 flex w-full flex-col justify-center gap-2 p-8 text-white-10">
					<div className="flex items-baseline gap-4 font-montserrat">
						<span className="text-4xl font-bold leading-none">
							{user.profile.displayName ?? user.username}
						</span>
						{user.bornAt && (
							<div className="flex h-fit gap-2">
								<span className="text-3xl leading-none">
									{new Date().getFullYear() - new Date(user.bornAt).getFullYear()}
								</span>
								{user.tags.includes("verified") && <ProfileVerificationBadge />}
							</div>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-2 font-montserrat">
						{user.profile.gender
							// don't display "Other" as a gender.
							.filter((gender) => !gender.metadata?.fallback)
							// some genders have a sort order, prioritize them.
							.sort((a, b) => ((a.metadata?.order ?? 0) < (b.metadata?.order ?? 0) ? 1 : -1))
							.map((gender) => (
								<Pill key={gender.id}>{gender.name}</Pill>
							))}
						{user.profile.country && <CountryPill code={user.profile.country} />}
					</div>
					<ActivityIndicator lastActiveAt={new Date()} />
				</div>
			</ProfileImageDisplay>
			<div className="flex-gap flex h-full grow flex-col gap-6 p-8 pb-0 sm:pb-8">
				<Html className="text-xl">
					{user.profile.biography || "No biography available yet, consider adding one."}
				</Html>
				<PillCollection user={user} />
			</div>
			<div className="h-32 w-full sm:h-0">
				<div className="pointer-events-none fixed left-0 bottom-16 flex h-32 w-full items-center justify-center p-8">
					<div className="pointer-events-auto flex h-fit overflow-hidden rounded-xl text-white-10 shadow-brand-1">
						<button className="flex items-center gap-3 bg-brand-gradient px-8 py-4" type="button">
							<HeartGradient className="w-8" gradient={false} />
							<span className="font-montserrat text-lg font-extrabold">Like</span>
						</button>
						<button className="flex items-center gap-3 bg-black-50 px-8 py-4" type="button">
							<XMarkIcon className="w-8" strokeWidth={3} />
							<span className="font-montserrat text-lg font-extrabold">Pass</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
