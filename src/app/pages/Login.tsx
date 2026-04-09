import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Droplets } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    const success = login(email, password, remember);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 opacity-90 z-10"></div>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1567475360083-31f83e5e9b0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMG1vbml0b3JpbmclMjByaXZlciUyMGFlcmlhbHxlbnwxfHx8fDE3NzMwOTMxMjl8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Water Monitoring"
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-12">
          <Droplets className="w-20 h-20 mb-6" />
          <h1 className="text-5xl font-bold mb-4">MakeSens</h1>
          <p className="text-xl text-center opacity-90">
            Sistem Monitoring Air Berbasis AI & IoT
          </p>
          <p className="text-sm text-center opacity-75 mt-2">
            AIEWS - AI Early Warning System
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Droplets className="w-12 h-12 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MakeSens</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Selamat Datang
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Masuk ke dashboard monitoring AIEWS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@instansi.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Ingat saya
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Lupa password?
              </a>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Login
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Daftar sekarang
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}