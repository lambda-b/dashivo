import { useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import type { DashboardListItem } from "@shared/api";

export const DashboardSidebar = ({
  activeId,
  open,
  dashboards,
  error,
  loading,
  creating,
  onCreate,
  onOpenChange,
  onSelect,
}: {
  activeId?: string;
  open: boolean;
  dashboards?: DashboardListItem[];
  error?: string;
  loading: boolean;
  creating: boolean;
  onCreate: (title: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}) => {
  const [title, setTitle] = useState("");

  return open ? (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col border-r border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
        <div>
          <p className="text-brand text-xs font-bold tracking-widest">DASHLET</p>
          <h2 className="mt-1 text-sm font-semibold">ダッシュボード</h2>
        </div>
        <button
          aria-label="一覧を閉じる"
          className="rounded-md p-2 text-stone-500 hover:bg-stone-100"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          マイダッシュボード
        </p>
        <nav aria-label="ダッシュボード一覧" className="grid gap-1">
          {dashboards?.map((dashboard) => (
            <button
              aria-current={activeId === dashboard.id ? "page" : undefined}
              className={`truncate rounded-md px-3 py-2.5 text-left text-sm ${activeId === dashboard.id ? "bg-red-50 font-semibold text-red-800" : "text-stone-700 hover:bg-stone-100"}`}
              key={dashboard.id}
              onClick={() => onSelect(dashboard.id)}
              type="button"
            >
              {dashboard.title}
            </button>
          ))}
          {loading && <p className="p-2 text-xs text-stone-500">読み込み中…</p>}
          {error && (
            <p role="alert" className="p-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </nav>
      </div>
      <form
        className="grid gap-2 border-t border-stone-200 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) onCreate(title.trim());
        }}
      >
        <label className="text-xs font-medium text-stone-600" htmlFor="new-dashboard-title">
          新しいダッシュボード
        </label>
        <input
          className="min-w-0 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          id="new-dashboard-title"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="タイトルを入力"
          value={title}
        />
        <button
          className="bg-brand hover:bg-brand-dark inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!title.trim() || creating}
          type="submit"
        >
          <Plus aria-hidden="true" className="size-4" />
          {creating ? "作成中…" : "作成"}
        </button>
      </form>
    </aside>
  ) : (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-12 flex-col items-center border-r border-stone-200 bg-white pt-3">
      <button
        aria-label="ダッシュボード一覧を開く"
        className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
        onClick={() => onOpenChange(true)}
        type="button"
      >
        <Menu aria-hidden="true" className="size-4" />
      </button>
    </aside>
  );
};
