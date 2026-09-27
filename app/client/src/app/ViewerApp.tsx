import { useState } from "react";
import { Dashboard } from "@/app/Dashboard";
import { DashboardIdContext } from "@/app/context/useDashboard";
import type { ParameterValue } from "@shared/dashboard";

const ViewerApp = () => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  const onParameterChange = (key: string, value: ParameterValue) =>
    setParams((current) => ({ ...current, [key]: value }));

  return (
    <DashboardIdContext.Provider value="sales-overview">
      <Dashboard params={params} onParameterChange={onParameterChange} />
    </DashboardIdContext.Provider>
  );
};

export default ViewerApp;
