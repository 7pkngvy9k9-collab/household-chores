import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthProvider";
import { SignInPage } from "./auth/SignInPage";
import { ChoresPage } from "./chores/ChoresPage";
import { ErrorMessage } from "./components/Feedback";
import { HouseholdProvider, useHousehold } from "./household/HouseholdProvider";
import { OnboardingPage } from "./household/OnboardingPage";

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
      <Route path="/" element={household ? <ChoresPage /> : <Navigate to="/setup" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
