
import { Link } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const PageNotFound = () => {
  return (
    <div className="min-h-svh bg-[#f8faf9] text-slate-900 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex items-center gap-3">
          <img
            src="/citylink-logo-new.png"
            alt="CityLink logo"
            className="h-10 w-10 rounded-full border border-emerald-200 object-cover dark:border-emerald-900/60"
          />
          <span className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-lg font-bold text-transparent">
            CityLink
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white/80 px-8 py-10 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Page not found</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
            The page you are looking for doesn&apos;t exist or has been moved.
            Please check the URL, or return to the homepage.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="outline" asChild className="h-11 rounded-full px-6">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button asChild className="h-11 rounded-full px-6">
              <Link to="/citizen/report-issue" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Report an Issue
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="h-11 rounded-full px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
