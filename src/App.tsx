import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthProvider";
import { SignInPage } from "./auth/SignInPage";
import { ChoresPage } from "./tasks/ChoresPage";
import { ChoresProvider } from "./tasks/ChoresProvider";
import { ErrorMessage } from "./components/Feedback";
import { DashboardPage } from "./dashboard/DashboardPage";
import { HouseholdProvider, useHousehold } from "./household/HouseholdProvider";
import { OnboardingPage } from "./household/OnboardingPage";
import { AppLayout } from "./layout/AppLayout";
import { PlaceholderPage } from "./pages/PlaceholderPage";

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
        <Route
          path="/shopping"
          element={
            <PlaceholderPage
              title="Shopping"
              body="No shopping items yet. Add the first item to your household shopping list."
            />
          }
        />
        <Route
          path="/finances"
          element={
            <PlaceholderPage
              title="Finances"
              body="No expenses yet. Shared costs and balances will live here."
            />
          }
        />
        <Route
          path="/calendar"
          element={
            <PlaceholderPage
              title="Calendar"
              body="No household events yet. Meetings, visitors, and garbage day will show up here."
            />
          }
        />
        <Route
          path="/noticeboard"
          element={
            <PlaceholderPage
              title="Noticeboard"
              body="No posts yet. Pin notes the household should see."
            />
          }
        />
        <Route
          path="/members"
          element={
            <PlaceholderPage
              title="Members"
              body="Household members and roles will be managed here."
              actionLabel="Back to overview"
              actionTo="/"
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              body="Household name, invite code, and preferences will live here."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
