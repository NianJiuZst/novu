import { FeatureFlagsKeysEnum } from "@novu/shared";
import { Navigate } from "react-router-dom";
import { AnimatedOutlet } from "@/components/animated-outlet";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageMeta } from "@/components/page-meta";
import { TranslationList } from "@/components/translations/translation-list";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { ROUTES } from "@/utils/routes";

export const TranslationsPage = () => {
	const isTranslationEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_TRANSLATION_ENABLED, false);

	if (!isTranslationEnabled) {
		return <Navigate to={ROUTES.WORKFLOWS} />;
	}

	return (
		<>
			<PageMeta title="Translations" />
			<DashboardLayout headerStartItems={<h1 className="text-foreground-950 flex items-center gap-1">Translations</h1>}>
				<TranslationList className="px-2.5" />
				<AnimatedOutlet />
			</DashboardLayout>
		</>
	);
};
