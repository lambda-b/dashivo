import { useState } from "react";
import { Dashboard } from "@/app/Dashboard";
import type { ParameterValue } from "@shared/dashboard";

const ViewerApp = () => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  const onParameterChange = (key: string, value: ParameterValue) =>
    setParams((current) => ({ ...current, [key]: value }));

  return <Dashboard params={params} onParameterChange={onParameterChange} />;
};

export default ViewerApp;
