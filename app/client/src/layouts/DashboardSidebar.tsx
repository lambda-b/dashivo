import { Button } from "@/components/primitives/Button";
import { AppBrand } from "@/components/AppBrand";
import { IconButton } from "@/components/primitives/IconButton";
import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";

import { dashboardIdSchema } from "@shared/dashboard";
import type { DashboardCreate } from "@shared/api";
import { useState, type ReactNode } from "react";
import { Menu, Plus, X } from "lucide-react";

export const DashboardSidebar = ({
  open,
  children,
  creating,
  onCreate,
  onOpenChange,
}: {
  open: boolean;
  children: ReactNode;
  creating: boolean;
  onCreate: (definition: DashboardCreate) => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const [id, setId] = useState("");
  const validId = dashboardIdSchema.safeParse(id).success;

  return open ? (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col border-r border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
        <div>
          <AppBrand />
          <h2 className="mt-1 text-sm font-semibold">ダッシュボード</h2>
        </div>
        <IconButton icon={X} label="一覧を閉じる" onClick={() => onOpenChange(false)} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          マイダッシュボード
        </p>
        <nav aria-label="ダッシュボード一覧" className="grid gap-1">
          {children}
        </nav>
      </div>
      <form
        className="grid gap-2 border-t border-stone-200 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (validId) onCreate({ id });
        }}
      >
        <h3 className="text-sm font-semibold">新しいダッシュボード</h3>
        <FormField label="ダッシュボードID">
          <TextInput
            id="new-dashboard-id"
            onChange={setId}
            placeholder="sales-overview"
            value={id}
          />
        </FormField>
        <p className="text-xs text-stone-500">半角英小文字・数字・ハイフンで指定してください。</p>
        <Button
          disabled={!validId}
          icon={Plus}
          pending={creating}
          size="regular"
          type="submit"
          variant="primary"
        >
          {creating ? "作成中…" : "作成"}
        </Button>
      </form>
    </aside>
  ) : (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-12 flex-col items-center border-r border-stone-200 bg-white pt-3">
      <IconButton icon={Menu} label="ダッシュボード一覧を開く" onClick={() => onOpenChange(true)} />
    </aside>
  );
};
