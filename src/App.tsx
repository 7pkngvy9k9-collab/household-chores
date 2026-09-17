import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthProvider";
import { SignInPage } from "./auth/SignInPage";
import { ChoresPage } from "./tasks/ChoresPage";
import { ChoresProvider } from "./tasks/ChoresProvider";
import { ErrorMessage } from "./components/Feedback";
import { DashboardPage } from "./dashboard/DashboardPage";
import { FinancesPage } from "./finance/FinancesPage";
import { HouseholdProvider, useHousehold } from "./household/HouseholdProvider";
import { MembersPage } from "./household/MembersPage";
import { OnboardingPage } from "./household/OnboardingPage";
import { SettingsPage } from "./household/SettingsPage";
import { AppLayout } from "./layout/AppLayout";
import { CalendarPage } from "./calendar/CalendarPage";
import { NoticeboardPage } from "./noticeboard/NoticeboardPage";
import { PollsPage } from "./polls/PollsPage";
import { ShoppingPage } from "./shopping/ShoppingPage";
import { useI18n } from "./i18n/LocaleProvider";

export function App() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <p className="empty boot">{t("common.loading")}</p>;

  if (!user) {
    return (
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  return (
    <HouseholdProvider>
      <SignedInRoutes />
    </HouseholdProvider>
  );
}

function SignedInRoutes() {
  const { loading, error, household } = useHousehold();
  const { t } = useI18n();

  if (loading) return <p className="empty boot">{t("common.loading")}</p>;

  if (error && !household) {
    return (
      <section className="setup card">
        <h1>{t("app.errorTitle")}</h1>
        <ErrorMessage message={error} />
      </section>
    );
  }

  return (
    <Routes>
      <Route
        path="/setup"
        element={household ? <Navigate to="/tasks" replace /> : <OnboardingPage />}
      />
      <Route
        element={
          household ? (
            <ChoresProvider>
              <AppLayout />
            </ChoresProvider>
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      >
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/overview" element={<DashboardPage />} />
        <Route path="/tasks" element={<ChoresPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/noticeboard" element={<NoticeboardPage />} />
        <Route path="/polls" element={<PollsPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}
