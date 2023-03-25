"use client";

import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import ms from "ms";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { ProfileImage } from "~/api/user/profile/images";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

import { ModalOuter } from "../modal";
import { Tooltip } from "../tooltip";

export interface ProfileImageDisplayProps {
	images: Array<ProfileImage>;
	children: React.ReactNode;
}

interface SingleImageProps {
	image: ProfileImage;
	className?: string;
}

const SingleImage: React.FC<SingleImageProps> = ({ className, image }) => {
	return (
		<img
			className={twMerge("aspect-square object-cover ", className)}
			src={image.url}
			onError={({ currentTarget }) => {
				// If the image fails to load (doesn't exist), use a fallback.
				currentTarget.src = urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4");
			}}
		/>
	);
};

const ImageToolbar: React.FC<{ image: ProfileImage }> = ({ image }) => {
	return (
		<div className="flex w-full items-center justify-between gap-4 bg-brand-gradient p-4">
			<span>
				<span suppressHydrationWarning>{`Uploaded ${ms(
					Date.now() - new Date(`${image.createdAt}Z`).getTime(),
					{
						long: true
					}
				)} ago`}</span>
				, and was {image.scanned ? "" : <span className="font-bold">not scanned</span>}.
			</span>
			<Tooltip value="Delete image">
				<button type="button">
					<TrashIcon className="h-5 w-5" />
				</button>
			</Tooltip>
		</div>
	);
};

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const firstImageId = images[0]?.id;
	const [expandedImage, setExpandedImage] = useState(false);
	const [session] = useSession();

	const [imageId, setImageId] = useState(firstImageId);
	useEffect(() => setImageId(firstImageId), [firstImageId]);

	const curImage = useMemo(
		() => images.find((image) => image.id === imageId) ?? 0,
		[imageId, images]
	);

	const set = useCallback(
		(direction: -1 | 0 | 1, imageId?: string) => {
			setImageId((curImageId) => {
				if (imageId !== undefined) return imageId;

				const curImageIdx = images.findIndex((image) => image.id === curImageId) ?? 0;

				const newImageOffset = curImageIdx + direction;
				const newImageId =
					images[(newImageOffset < 0 ? images.length - 1 : newImageOffset) % images.length].id;
				return newImageId;
			});
		},
		[images]
	);

	return (
		<div className="relative shrink-0 overflow-hidden">
			<div className="relative flex aspect-square shrink-0 bg-black-70">
				{images.map((image) => (
					<SingleImage
						image={image}
						key={image.id}
						className={twMerge(
							"transition-opacity duration-500",
							image.id === imageId ? "opacity-100" : "absolute h-full w-full opacity-0"
						)}
					/>
				))}

				{images.length > 1 && (
					<>
						<div className="absolute flex h-full w-full">
							<button
								className="flex h-full grow items-center justify-start px-8 opacity-0 transition-opacity hover:opacity-100"
								type="button"
								onClick={() => set(-1)}
							>
								<ChevronLeftIcon className="h-8 w-8" />
							</button>
							<button
								className="flex h-full grow items-center justify-end px-8 opacity-0 transition-opacity hover:opacity-100"
								type="button"
								onClick={() => set(1)}
							>
								<ChevronRightIcon className="h-8 w-8" />
							</button>
						</div>
						<div className="pointer-events-auto absolute top-0 flex w-full px-8 py-6">
							<div className="flex grow items-center gap-2">
								{images.map((image) => (
									<button
										key={image.id}
										type="button"
										className={twMerge(
											"h-1.5 grow rounded-full",
											image.id === imageId ? "bg-white-10/50" : "bg-black-70/50"
										)}
										onClick={() => set(0, image.id)}
									/>
								))}
							</div>
						</div>
					</>
				)}
				<div className="pointer-events-none absolute flex h-full w-full items-center justify-center">
					<button
						className="pointer-events-auto h-full w-1/3"
						type="button"
						onClick={() => setExpandedImage(true)}
					/>
					{curImage && (
						<ModalOuter
							visible={expandedImage}
							modalOuterProps={{
								className: "p-8 sm:p-32"
							}}
							onVisibilityChange={setExpandedImage}
						>
							<div
								className="relative flex cursor-default flex-col overflow-hidden rounded-xl text-white-20"
								onClick={(event) => event.stopPropagation()}
							>
								<button
									className="absolute right-0 m-4"
									type="button"
									onClick={() => setExpandedImage(false)}
								>
									<XMarkIcon className="h-6 w-6" />
								</button>
								<SingleImage className="max-h-[80vh]" image={curImage} />
								{session?.user.tags.includes("moderator") && <ImageToolbar image={curImage} />}
							</div>
						</ModalOuter>
					)}
				</div>
				<div className="pointer-events-none absolute bottom-0 h-full w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
					{children}
				</div>
			</div>
		</div>
	);
};
