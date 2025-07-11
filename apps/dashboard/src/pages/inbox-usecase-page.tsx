import { useEffect } from "react";
import { AnimatedPage } from "@/components/onboarding/animated-page";
import { AuthCard } from "../components/auth/auth-card";
import { InboxPlayground } from "../components/auth/inbox-playground";
import { PageMeta } from "../components/page-meta";
import { useTelemetry } from "../hooks/use-telemetry";
import { TelemetryEvent } from "../utils/telemetry";

export function InboxUsecasePage() {
	const telemetry = useTelemetry();

	useEffect(() => {
		telemetry(TelemetryEvent.INBOX_USECASE_PAGE_VIEWED);
	}, [telemetry]);

	return (
		<AnimatedPage>
			<PageMeta title="Integrate with the Inbox component" />
			<AuthCard>
				<InboxPlayground />
			</AuthCard>
		</AnimatedPage>
	);
}
