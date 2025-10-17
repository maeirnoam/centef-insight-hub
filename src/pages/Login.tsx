import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGuestLogin = () => {
    localStorage.setItem('userRole', 'guest');
    localStorage.setItem('username', 'Guest');
    navigate('/chat');
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, user_roles(role)')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
        return;
      }

      localStorage.setItem('userId', data.id);
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', data.user_roles[0]?.role || 'member');
      
      navigate('/chat');
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary-foreground">CENTEF</h1>
          <p className="text-primary-foreground/90">Center for Research of Terror Financing</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Login</CardTitle>
              <CardDescription>Sign in with your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Access</CardTitle>
              <CardDescription>Continue without an account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGuestLogin} variant="outline" className="w-full">
                Continue as Guest
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
