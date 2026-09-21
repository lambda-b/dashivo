export const buildDashboardFile = async () => {
  const response = await fetch("/__dashlet/build", { method: "POST" });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error ?? "HTMLを生成できませんでした。");
  }

  return response.blob();
};
