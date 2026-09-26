import { Mutex } from "async-mutex";

const dashboardOperation = new Mutex();

export const withDashboardOperation = <Result>(operation: () => Promise<Result>) =>
  dashboardOperation.runExclusive(operation);
