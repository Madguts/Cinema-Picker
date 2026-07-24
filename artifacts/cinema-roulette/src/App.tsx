import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { FilmGrainOverlay } from '@/components/FilmGrainOverlay';
import HomePage from '@/pages/home';
import MoviesPage from '@/pages/movies';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function Router() {
  return (
    <>
      <NavBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/movies" component={MoviesPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <FilmGrainOverlay />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
