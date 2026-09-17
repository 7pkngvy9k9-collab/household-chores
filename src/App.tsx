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
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ShoppingPage } from "./shopping/ShoppingPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) return <p className="empty">Loading…</p>;

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

  if (loading) return <p className="empty">Loading…</p>;

  if (error && !household) {
    return (
      <section className="setup card">
        <h1>Something went wrong</h1>
        <ErrorMessage message={error} />
      </section>
    );
  }

  return (
    <Routes>
      <Route
        path="/setup"
        element={household ? <Navigate to="/" replace /> : <OnboardingPage />}
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<ChoresPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route
          path="/noticeboard"
          element={
            <PlaceholderPage
              title="Noticeboard"
              body="No posts yet. Pin notes the household should see."
            />
          }
        />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
