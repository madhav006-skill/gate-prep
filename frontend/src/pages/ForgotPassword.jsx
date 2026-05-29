import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const { forgotPassword, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await forgotPassword(email);
    if (res?.success) {
      setSubmitted(true);
      // For dev environment since we don't have email setup
      if (res.resetUrl) {
        setDevResetUrl(res.resetUrl);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] px-4 font-sans text-gray-200">
      <div className="max-w-md w-full bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} className="mr-1" /> Back to login
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400">Enter your email and we'll send you a reset link</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-full">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white">Check your email</h3>
            <p className="text-gray-400 text-sm">
              We've sent password reset instructions to <br />
              <span className="text-white font-medium">{email}</span>
            </p>
            
            {/* Dev Environment Helper */}
            {devResetUrl && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
                <p className="text-xs text-blue-400 font-bold mb-2 uppercase">Dev Environment Helper</p>
                <p className="text-sm text-gray-300 mb-3">Since no email service is configured, click the link below to reset your password:</p>
                <a href={devResetUrl} className="text-blue-500 hover:text-blue-400 text-sm break-all font-medium underline">
                  {devResetUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="you@example.com"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !email}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
