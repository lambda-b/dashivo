import { CfnParameter, Stack, type App, type StackProps } from "aws-cdk-lib";
import { CfnBudget } from "aws-cdk-lib/aws-budgets";

export const createBudgetStack = (app: App, id: string, props: StackProps) => {
  const stack = new Stack(app, id, props);
  const email = new CfnParameter(stack, "NotificationEmail", {
    type: "String",
    noEcho: true,
    description: "Private email address for monthly account-wide cost notifications.",
  });

  new CfnBudget(stack, "MonthlyBudget", {
    budget: {
      budgetName: "Dashivo-Monthly-Account-Cost",
      budgetType: "COST",
      timeUnit: "MONTHLY",
      budgetLimit: { amount: 5, unit: "USD" },
    },
    notificationsWithSubscribers: ["ACTUAL", "FORECASTED"].map((notificationType) => ({
      notification: {
        notificationType,
        comparisonOperator: "GREATER_THAN",
        threshold: 5,
        thresholdType: "ABSOLUTE_VALUE",
      },
      subscribers: [{ subscriptionType: "EMAIL", address: email.valueAsString }],
    })),
  });

  return stack;
};
