import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import type { MemberRoleEnum, PermissionsEnum } from "@novu/shared";
import type { ReactNode } from "react";
import { EnvironmentProvider } from "@/context/environment/environment-provider";
import { PermissionProtectedRoute } from "./permission-protected-route";

interface ProtectedRouteProps {
	children: ReactNode;
	permission?: PermissionsEnum;
	condition?: (has: (params: { permission: PermissionsEnum } | { role: MemberRoleEnum }) => boolean) => boolean;
	isDrawerRoute?: boolean;
}

export const ProtectedRoute = ({ children, permission, condition, isDrawerRoute }: ProtectedRouteProps) => {
	return (
		<>
			<SignedIn>
				<EnvironmentProvider>
					{permission || condition ? (
						<PermissionProtectedRoute permission={permission} condition={condition} isDrawerRoute={isDrawerRoute}>
							{children}
						</PermissionProtectedRoute>
					) : (
						children
					)}
				</EnvironmentProvider>
			</SignedIn>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
};
