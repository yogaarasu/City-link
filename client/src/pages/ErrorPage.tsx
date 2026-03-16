import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  const statusCode = isRouteError ? error.status : 500;
  const title = isRouteError ? error.statusText || "Oops!" : "Oops!";
  const message =
    isRouteError && typeof error.data === "string"
      ? error.data
      : error instanceof Error
        ? error.message
        : "Something went wrong while loading this page.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Error {statusCode}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">{message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Go to Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Go Back
          </button>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          If this keeps happening, please report the issue to support.
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
