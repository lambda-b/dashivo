import App from "@/app/App";
import { useAuthentication } from "@/auth/useAuthentication";
import { AppBrand } from "@/components/AppBrand";
import { Button } from "@/components/primitives/Button";

const AuthGate = () => {
  const { user, login, logout, pending } = useAuthentication();

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100 p-6">
        <section className="w-full max-w-sm space-y-6 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <AppBrand />
          <div>
            <h1 className="text-xl font-bold">ダッシュボードを作成する</h1>
            <p className="mt-2 text-sm text-stone-600">
              ログインして、データとPythonから見せ方を組み立てましょう。
            </p>
          </div>
          <Button
            className="w-full justify-center"
            variant="primary"
            size="regular"
            onClick={() => login()}
            pending={pending}
          >
            ログイン
          </Button>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="flex min-h-12 items-center justify-end gap-3 border-b border-stone-200 bg-white px-4 text-xs text-stone-600 lg:pl-72">
        {typeof user.email === "string" && <span className="truncate">{user.email}</span>}
        <Button onClick={() => logout()} pending={pending}>
          ログアウト
        </Button>
      </div>
      <App />
    </>
  );
};

export default AuthGate;
