import React from "react";

const RegisterVerify = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl text-center">

        {/* Icon */}
        <div className="text-5xl mb-5">📩</div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-white mb-3">
          Check Your Email
        </h2>

        {/* Description */}
        <p className="text-slate-300 text-sm leading-relaxed">
          We've sent a verification link to your email address.  
          Please click the link to activate your account and continue.
        </p>

        {/* Divider */}
        <div className="my-6 border-t border-white/10"></div>

        {/* Hint */}
        <p className="text-xs text-slate-400">
          Didn’t receive the email? Check your spam folder or try registering again.
        </p>

        {/* Optional button (nice UX upgrade) */}
        {/* <button className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:-translate-y-0.5">
          Go back to Register
        </button> */}

      </div>
    </div>
  );
};

export default RegisterVerify;






// import React from "react";

// const RegisterVerify = () => {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        
//         <div className="text-4xl mb-4">✅</div>

//         <h2 className="text-2xl font-semibold text-gray-800 mb-2">
//           Check Your Email
//         </h2>

//         <p className="text-gray-600 text-sm leading-relaxed">
//           We've sent you an email to verify your account.  
//           Please check your inbox and click the verification link to continue.
//         </p>

//         <p className="mt-4 text-xs text-gray-400">
//           Didn't receive the email? Check your spam folder.
//         </p>

//       </div>
//     </div>
//   );
// };

// export default RegisterVerify;

