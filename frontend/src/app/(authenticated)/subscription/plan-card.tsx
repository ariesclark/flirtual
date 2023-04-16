import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { withSession } from "~/server-utilities";

interface PlanCardProps {
	id: string;
	duration: number;
	price: number;
	originalPrice?: number;
	discount?: number;
	highlight?: boolean;
}

export async function PlanCard(props: PlanCardProps) {
	const { duration, price, originalPrice = props.price, discount, highlight } = props;
	const { user } = await withSession();

	const activePlan = (user.subscription?.active && user.subscription.plan.id === props.id) ?? false;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex flex-col justify-between gap-16 rounded-xl p-6",
				highlight
					? "bg-white-20 dark:bg-black-80"
					: [containerClassName, "bg-white-25 dark:bg-black-80"]
			)}
		>
			<div className="flex flex-col">
				<span
					className={twMerge(
						"font-montserrat text-sm font-semibold text-black-60 line-through dark:text-white-50",
						price === originalPrice && "invisible"
					)}
				>
					{`$${originalPrice}`}
				</span>
				<span className="font-montserrat text-3xl font-semibold">${price}</span>
				<span>every {duration === 1 ? "month" : `${duration} months`}</span>
			</div>
			{discount && (
				<div
					className="absolute right-0 top-0 flex aspect-square items-center justify-center rounded-tr-xl bg-brand-gradient p-3 text-white-20"
					style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)", margin: "-1px -1px 0 0" }}
				>
					<div className="origin-center -translate-y-3 translate-x-3 rotate-45">
						<span className="font-semibold">Save {discount}%</span>
					</div>
				</div>
			)}
			<ButtonLink
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				target="_self"
				href={
					activePlan
						? api.subscription.manageUrl().toString()
						: api.subscription.checkoutUrl(props.id).toString()
				}
			>
				{activePlan ? "Manage" : "Subscribe"}
			</ButtonLink>
		</div>
	);

	return highlight ? (
		<div className={twMerge("rounded-xl bg-brand-gradient p-1 ", highlight && containerClassName)}>
			{inner}
		</div>
	) : (
		inner
	);
}
