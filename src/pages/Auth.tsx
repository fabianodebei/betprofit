import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo_centurion_new.png";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { authStorage } from "@/utils/authStorage";
import { cn } from "@/lib/utils";
const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri")
});

const resetPasswordSchema = z.object({
  email: z.string().email("Email non valida")
});
const signupSchema = z.object({
  fullName: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"]
});
type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
const Auth = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: ""
    }
  });

  // Carica email salvata al mount
  useEffect(() => {
    const savedEmail = authStorage.getSavedEmail();
    if (savedEmail) {
      loginForm.setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Autofocus sul primo campo quando cambia tab
  useEffect(() => {
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  }, [activeTab]);
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      authStorage.saveEmail(data.email, rememberMe);
      toast.success("Accesso effettuato con successo!", {
        description: "Benvenuto in Centurion Club"
      });
      navigate("/");
    } catch (error) {
      // Errore già gestito da AuthContext
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      authStorage.saveEmail(data.email, false);
      toast.success("Account creato con successo!", {
        description: "Controlla la tua email per confermare l'account"
      });
    } catch (error) {
      // Errore già gestito da AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (!error) {
        toast.success("Email inviata!", {
          description: "Controlla la tua casella di posta per reimpostare la password"
        });
        setShowResetPassword(false);
        resetPasswordForm.reset();
      }
    } catch (error) {
      // Errore già gestito da AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Il redirect sarà gestito automaticamente da Google OAuth
    } catch (error) {
      // Errore già gestito da AuthContext
      setIsGoogleLoading(false);
    }
  };

  // Helper per mostrare lo stato di validazione
  const getFieldValidationIcon = (fieldName: keyof LoginFormData | keyof SignupFormData) => {
    const form = activeTab === "login" ? loginForm : signupForm;
    const value = form.watch(fieldName as any);
    const error = form.formState.errors[fieldName as any];
    
    if (!value) return null;
    
    return error ? (
      <X className="h-4 w-4 text-destructive" />
    ) : (
      <Check className="h-4 w-4 text-green-500" />
    );
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Centurion Club" className="h-48 w-auto " />
          </div>
          <CardDescription>Gestisci le tue scommesse in modo professionale</CardDescription>

          <Link to="/guida" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2 my-0 px-[10px] mx-[110px]">
            <BookOpen className="h-4 w-4" />
            Leggi la guida setup
          </Link>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="transition-all">Login</TabsTrigger>
              <TabsTrigger value="signup" className="transition-all">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-fade-in">
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 relative"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isGoogleLoading ? "Connessione..." : "Continua con Google"}
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">oppure</span>
                </div>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField 
                    control={loginForm.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="email" 
                              placeholder="tua@email.com" 
                              autoFocus
                              {...field}
                              ref={emailInputRef}
                              className={cn(
                                loginForm.watch("email") && !loginForm.formState.errors.email && "border-green-500"
                              )}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("email")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <FormField 
                    control={loginForm.control} 
                    name="password" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Ricordami
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Accesso..." : "Accedi"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(true);
                      const lastEmail = authStorage.getLastEmail();
                      if (lastEmail) {
                        resetPasswordForm.setValue("email", lastEmail);
                      }
                    }}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Password dimenticata?
                  </button>
                </form>
              </Form>

              {showResetPassword && (
                <div className="mt-4 p-4 border rounded-md bg-muted/50 animate-fade-in">
                  <h3 className="text-sm font-medium mb-3">Recupera Password</h3>
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-3">
                      <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="email" 
                                  placeholder="tua@email.com" 
                                  autoFocus
                                  {...field}
                                  className={cn(
                                    resetPasswordForm.watch("email") && !resetPasswordForm.formState.errors.email && "border-green-500"
                                  )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {resetPasswordForm.watch("email") && !resetPasswordForm.formState.errors.email && (
                                    <Check className="h-4 w-4 text-green-500" />
                                  )}
                                  {resetPasswordForm.formState.errors.email && (
                                    <X className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="animate-fade-in" />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading} className="flex-1">
                          {isLoading ? "Invio..." : "Invia Email"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowResetPassword(false);
                            resetPasswordForm.reset();
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in">
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 relative"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isGoogleLoading ? "Connessione..." : "Continua con Google"}
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">oppure</span>
                </div>
              </div>

              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <FormField 
                    control={signupForm.control} 
                    name="fullName" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Mario Rossi" 
                              autoFocus
                              {...field}
                              className={cn(
                                signupForm.watch("fullName") && !signupForm.formState.errors.fullName && "border-green-500"
                              )}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("fullName")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <FormField 
                    control={signupForm.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="email" 
                              placeholder="tua@email.com" 
                              {...field}
                              className={cn(
                                signupForm.watch("email") && !signupForm.formState.errors.email && "border-green-500"
                              )}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("email")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <FormField 
                    control={signupForm.control} 
                    name="password" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="••••••" 
                            showStrengthIndicator 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <FormField 
                    control={signupForm.control} 
                    name="confirmPassword" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conferma Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>
                    )} 
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creazione account..." : "Crea Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;