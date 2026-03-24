import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/services/supabase';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { toast } from 'sonner';
import { generateAvatar, getSeedFromUser } from '@/src/utils/avatar';
import { Typewriter } from '@/src/components/ui/typewriter';
import { Film } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured');
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user) {
          const seed = getSeedFromUser(name, email);
          const avatar_url = generateAvatar(seed);
          await supabase.from('profiles').insert({ id: data.user.id, name, avatar_url });
        }
        toast.success('Account created! Please check your email.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-zinc-950 border-r border-white/5 px-14 py-16 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(234,179,8,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(239,68,68,0.06)_0%,_transparent_60%)]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <Film className="h-4 w-4 text-black" />
          </div>
          <span className="font-display text-lg font-black tracking-widest text-white uppercase">
            SceneFinds
          </span>
        </div>

        {/* Typewriter hero text */}
        <div className="relative">
          <p className="text-white/30 text-sm font-medium uppercase tracking-widest mb-4">
            Your cinematic universe
          </p>
          <h2 className="text-5xl font-black leading-tight text-white mb-2">
            <Typewriter
              text={['Discover.', 'Discuss.', 'Watch.', 'Obsess.']}
              speed={80}
              deleteSpeed={45}
              waitTime={2000}
              cursorChar="_"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
              cursorClassName="text-yellow-400"
            />
          </h2>
          <p className="text-white/40 text-base leading-relaxed max-w-sm mt-6">
            Track every movie you've watched, rate your favorites, and discover what to watch next.
          </p>
        </div>

        {/* Bottom quote */}
        <p className="relative text-white/20 text-xs italic">
          "Cinema is a mirror by which we often see ourselves." — Martin Scorsese
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-black">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2.5 mb-10">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <Film className="h-4 w-4 text-black" />
          </div>
          <span className="font-display text-lg font-black tracking-widest text-white uppercase">
            SceneFinds
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile typewriter */}
          <div className="md:hidden mb-8 text-center">
            <h2 className="text-3xl font-black text-white">
              <Typewriter
                text={['Discover.', 'Discuss.', 'Watch.']}
                speed={80}
                deleteSpeed={45}
                waitTime={2000}
                cursorChar="_"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                cursorClassName="text-yellow-400"
              />
            </h2>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-white/40 text-sm mb-8">
            {isLogin
              ? 'Sign in to your SceneFinds account'
              : 'Join SceneFinds and start tracking'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-white/10 h-12 rounded-xl"
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-white/10 h-12 rounded-xl"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-white/10 h-12 rounded-xl"
              required
            />
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-base"
              disabled={loading}
            >
              {loading ? 'Processing…' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-yellow-400 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
