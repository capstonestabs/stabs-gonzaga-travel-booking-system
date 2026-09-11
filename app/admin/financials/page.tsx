import type { Route } from "next";
import Link from "next/link";

import { AdminFinancialOverview } from "@/components/site/admin-financial-overview";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/repositories";
import { FolderClock } from "lucide-react";

export default async function AdminFinancialsPage() {
	await requireRole(["admin"]);
	const data = await getAdminDashboardData();

	return (
		<DashboardShell
			role="admin"
			title="Financial payments"
			description="Review online and onsite payments, totals, receipts, and settlement status in one place."
		>
			<div className="flex justify-end">
				<Link href={"/admin/financials/history" as Route}>
					<Button variant="outline" size="sm">
						<FolderClock className="h-4 w-4" />
						Open payout history
					</Button>
				</Link>
			</div>
			<AdminFinancialOverview records={data.financialRecords} />
		</DashboardShell>
	);
}
