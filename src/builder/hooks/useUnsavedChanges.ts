import { useEffect } from "react";
import { useBlocker, useBeforeUnload } from "react-router-dom";
export const useUnsavedChanges = (dirty: boolean) => {
  const blocker = useBlocker(dirty);
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("未保存のPythonコードを破棄して移動しますか？")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
};
