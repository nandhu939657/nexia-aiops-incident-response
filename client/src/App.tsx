import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Incidents from "@/pages/Incidents";
import Jobs from "@/pages/Jobs";
import IncidentDetail from "@/pages/IncidentDetail";
import Runbooks from "@/pages/Runbooks";
import Activity from "@/pages/Activity";
import Settings from "@/pages/Settings";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <AppShell><Switch><Route path="/" component={Home} /><Route path="/incidents" component={Incidents} />      <Route path="/incidents/:id" component={IncidentDetail} />
      <Route path="/jobs" component={Jobs} /><Route path="/runbooks" component={Runbooks} /><Route path="/activity" component={Activity} /><Route path="/settings" component={Settings} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
