"use client";

import { ModelCard } from "~/components/model-card";
import { InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { Form, FormButton } from "~/components/forms";
import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";
import { VRChatIcon } from "~/components/icons";
// import { useDevice } from "~/hooks/use-device";

import { AddConnectionButton } from "./add-connection-button";

export default function SettingsAccountConnectionsPage(props: {
	searchParams?: {
		error?: string;
	};
}) {
	// const { platform } = useDevice();
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	if (!session) return null;

	const { user } = session;

	const error = props.searchParams?.error;
	return (
		<ModelCard className="sm:max-w-2xl" title="Connected accounts">
			{error && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">{error}</span>
				</div>
			)}
			<div className="flex flex-col gap-4">
				<div>
					<span className="flex select-none text-xl">
						Add accounts to your profile
					</span>
					<span className="select-none text-black-50 dark:text-white-50">
						People can see your accounts after you match, to help you meet up.
						You&apos;ll also be able to log into Flirtual with your Discord
						account.
					</span>
				</div>
				<Form
					className="flex flex-col gap-8"
					fields={{
						vrchat: user.profile.vrchat || ""
					}}
					onSubmit={async ({ vrchat }) => {
						const [profile] = await Promise.all([
							await api.user.profile.update(user.id, {
								body: {
									vrchat: vrchat.trim() || null
								}
							})
						]);

						toasts.add("Saved connections");

						await mutateSession({
							...session,
							user: {
								...user,
								profile: {
									...profile
								}
							}
						});
					}}
				>
					{({ FormField }) => (
						<div className="grid gap-4 lg:grid-cols-2">
							<AddConnectionButton type="discord" />
							{/* <AddConnectionButton type="vrchat" />
							{platform === "apple" ? (
								<>
									<AddConnectionButton type="apple" />
									<AddConnectionButton type="google" />
								</>
							) : (
								<>
									<AddConnectionButton type="google" />
									<AddConnectionButton type="apple" />
								</>
							)}
							<AddConnectionButton type="meta" /> */}
							<FormField className="col-span-2 lg:col-span-1" name="vrchat">
								{(field) => (
									<InputText
										connection
										Icon={VRChatIcon}
										iconColor="#095d6a"
										placeholder="VRChat"
										{...field.props}
									/>
								)}
							</FormField>
							<FormButton className="col-span-2 mt-4">Update</FormButton>
						</div>
					)}
				</Form>
			</div>
		</ModelCard>
	);
}
