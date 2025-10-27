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
// Email validation schema with essential requirements
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email richiesta")
  .max(255, "Email troppo lunga")
  .email("Formato email non valido")
  .toLowerCase()
  .refine((email) => {
    // Verifica formato base email
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    // Verifica che ci sia un dominio con estensione
    return local.length > 0 && domain.includes('.') && domain.length > 3;
  }, "Email non valida");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri")
});

const resetPasswordSchema = z.object({
  email: emailSchema
});

const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, "Il nome deve essere di almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  email: emailSchema,
  password: z.string()
    .min(6, "La password deve essere di almeno 6 caratteri")
    .max(128, "La password è troppo lunga"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"]
});
type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
const Auth = () => {
  const {
    signIn,
    signUp,
    resetPassword
  } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginError, setLoginError] = useState<string | null>(null);
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

  // Sync validation: show immediate hint when passwords don't match
  const password = signupForm.watch("password");
  const confirmPassword = signupForm.watch("confirmPassword");
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      signupForm.setError("confirmPassword", {
        type: "validate",
        message: "Le password non coincidono",
      });
    } else {
      signupForm.clearErrors("confirmPassword");
    }
  }, [password, confirmPassword, signupForm]);

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
    setLoginError(null);
    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setLoginError("Credenziali non valide. Verifica email e password.");
      } else {
        authStorage.saveEmail(data.email, rememberMe);
        toast.success("Accesso effettuato con successo!", {
          description: "Benvenuto in Centurion Club"
        });
        navigate("/");
      }
    } catch (error) {
      setLoginError("Credenziali non valide. Verifica email e password.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);

    // Blocco immediato se le password non combaciano
    if (data.password !== data.confirmPassword) {
      signupForm.setError("confirmPassword", {
        type: "validate",
        message: "Le password non coincidono",
      });
      toast.error("Le password non coincidono", {
        description: "Assicurati che i due campi coincidano."
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp(data.email.toLowerCase().trim(), data.password, data.fullName.trim());
      
      if (result.error) {
        // Gestione errori specifici da Supabase
        const errorMessage = result.error.message || "";
        if (errorMessage.includes('Invalid email')) {
          toast.error("Email non valida", {
            description: "L'indirizzo email inserito non è valido. Verifica e riprova."
          });
        } else if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
          toast.error("Email già registrata", {
            description: "Questo indirizzo email è già associato a un account. Prova ad accedere."
          });
        } else {
          toast.error("Errore durante la registrazione", {
            description: "Si è verificato un problema. Riprova più tardi."
          });
        }
      } else {
        authStorage.saveEmail(data.email.toLowerCase(), false);
        toast.success("Account creato con successo!", {
          description: "Controlla la tua email per confermare l'account"
        });
        // Porta l'utente al login dopo la registrazione
        setActiveTab("login");
        signupForm.reset();
      }
    } catch (error) {
      toast.error("Errore durante la registrazione", {
        description: "Si è verificato un problema. Riprova più tardi."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const {
        error
      } = await resetPassword(data.email);
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

  // Helper per mostrare lo stato di validazione
  const getFieldValidationIcon = (fieldName: keyof LoginFormData | keyof SignupFormData) => {
    const form = activeTab === "login" ? loginForm : signupForm;
    const value = form.watch(fieldName as any);
    const error = form.formState.errors[fieldName as any];
    if (!value) return null;
    return error ? <X className="h-4 w-4 text-destructive" /> : <Check className="h-4 w-4 text-green-500" />;
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Centurion Club" className="h-48 w-auto " />
          </div>
          <CardDescription>Gestisci le tue scommesse in modo professionale</CardDescription>

          
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="transition-all">Login</TabsTrigger>
              <TabsTrigger value="signup" className="transition-all">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-fade-in">
              {loginError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium">{loginError}</p>
                </div>
              )}

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="email" placeholder="tua@email.com" autoFocus {...field} ref={emailInputRef} className={cn(loginForm.watch("email") && !loginForm.formState.errors.email && "border-green-500")} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("email")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

                  <FormField control={loginForm.control} name="password" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
                    <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Ricordami
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Accesso..." : "Accedi"}
                  </Button>

                  <button type="button" onClick={() => {
                  setShowResetPassword(true);
                  const lastEmail = authStorage.getLastEmail();
                  if (lastEmail) {
                    resetPasswordForm.setValue("email", lastEmail);
                  }
                }} className="text-sm text-primary hover:underline mt-2">
                    Password dimenticata?
                  </button>
                </form>
              </Form>

              {showResetPassword && <div className="mt-4 p-4 border rounded-md bg-muted/50 animate-fade-in">
                  <h3 className="text-sm font-medium mb-3">Recupera Password</h3>
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-3">
                      <FormField control={resetPasswordForm.control} name="email" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="email" placeholder="tua@email.com" autoFocus {...field} className={cn(resetPasswordForm.watch("email") && !resetPasswordForm.formState.errors.email && "border-green-500")} />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {resetPasswordForm.watch("email") && !resetPasswordForm.formState.errors.email && <Check className="h-4 w-4 text-green-500" />}
                                  {resetPasswordForm.formState.errors.email && <X className="h-4 w-4 text-destructive" />}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="animate-fade-in" />
                          </FormItem>} />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading} className="flex-1">
                          {isLoading ? "Invio..." : "Invia Email"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                      setShowResetPassword(false);
                      resetPasswordForm.reset();
                    }}>
                          Annulla
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>}
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <FormField control={signupForm.control} name="fullName" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Mario Rossi" autoFocus {...field} className={cn(signupForm.watch("fullName") && !signupForm.formState.errors.fullName && "border-green-500")} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("fullName")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

                  <FormField control={signupForm.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="email" placeholder="tua@email.com" {...field} className={cn(signupForm.watch("email") && !signupForm.formState.errors.email && "border-green-500")} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {getFieldValidationIcon("email")}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

                  <FormField control={signupForm.control} name="password" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" showStrengthIndicator {...field} />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

                  <FormField control={signupForm.control} name="confirmPassword" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Conferma Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage className="animate-fade-in" />
                      </FormItem>} />

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