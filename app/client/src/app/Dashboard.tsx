import { useQuery } from "@dashlet/shared-lib/query";
import { useDashboard, useDashboardId } from "@/app/context/useDashboard";
import type { BuilderActions } from "@/builder/DashboardBuilder";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { ParameterArea } from "@/layouts/ParameterArea";
import { LogicArea } from "@/layouts/LogicArea";
import { ContentArea } from "@/layouts/ContentArea";
import { analysisPort } from "@/ports/analysis";
import type { ParameterValue } from "@shared/dashboard";
import { validateContentBindings } from "@/schema/validation";

export const Dashboard = ({
  actions,
  params,
  onParameterChange,
}: {
  actions?: BuilderActions;
  params: Record<string, ParameterValue>;
  onParameterChange: (key: string, value: ParameterValue) => void;
}) => {
  const dashboard = useDashboard();
  const dashboardId = useDashboardId();
  const values = Object.fromEntries(
    dashboard.controls.map((control) => [control.key, params[control.key] ?? control.defaultValue]),
  );

  const analysis = useQuery({
    meta: { errorMessage: false },
    queryKey: ["analysis", dashboard.analysis, values],
    queryFn: () => analysisPort.execute(values, dashboard.analysis, dashboardId),
    select: (result) => validateContentBindings(dashboard, result),
    retry: false,
  });

  return (
    <main className="min-h-screen bg-stone-100">
      <DashboardHeader
        analysis={analysis}
        download={actions?.download}
        downloadPending={actions?.downloadPending}
        onEditHeader={actions?.openHeader}
      />
      <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="grid gap-4 lg:sticky lg:top-5">
            <ParameterArea
              params={values}
              onChange={onParameterChange}
              onEditParameters={actions?.openParameters}
            />
            {actions && <LogicArea onEditAnalysis={actions.openAnalysis} />}
          </div>
          <ContentArea
            analysis={analysis}
            onAddContent={actions?.addContent}
            onEditContent={actions?.editContent}
            onEditTabs={actions?.openTabs}
          />
        </div>
      </div>
    </main>
  );
};
