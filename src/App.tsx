import LoginView from "./views/auth/LoginView";
import DashboardView from "./views/dashboard/DashboardView";
import EditorLayout from "./views/editor/EditorLayout";
import { useAppStore } from "./viewmodels/useAppStore";
import { useProjectStore } from "./viewmodels/useProjectStore";

function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const activeBookId = useProjectStore((state) => state.activeBookId);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // If authenticated but no active book is selected, show Dashboard (Series & Books views)
  if (!activeBookId) {
    return <DashboardView />;
  }

  // Active book is selected, show the workspace
  return <EditorLayout />;
}

export default App;
