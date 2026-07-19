import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

const PageNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-10 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 border border-red-400/30">
            <FaExclamationTriangle className="text-red-400 text-4xl" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-extrabold text-white tracking-wider">
          404
        </h1>

        {/* Heading */}
        <h2 className="mt-4 text-3xl font-bold text-white">
          Oops! Page Not Found
        </h2>

        {/* Description */}
        <p className="mt-4 text-slate-300 leading-relaxed">
          The page you're looking for doesn't exist, has been moved,
          or the URL may be incorrect.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          {/* <Link
            to="/"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-1"
          >
            Go to Login
          </Link> */}

          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
          >
            Go Back
          </button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-sm text-slate-400">
          Error Code: <span className="font-semibold text-red-400">404</span>
        </p>
      </div>
    </div>
  );
};

export default PageNotFound;