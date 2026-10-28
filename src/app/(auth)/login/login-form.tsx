"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .email("Digite um e-mail válido, como nome@empresa.com.br.");

const senhaSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

const magicSchema = z.object({
  email: emailSchema,
});

type SenhaValues = z.infer<typeof senhaSchema>;
type MagicValues = z.infer<typeof magicSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/painel";

  const [showPassword, setShowPassword] = useState(false);
  const [magicSent, setMagicSent] = useState<string | null>(null);

  const senhaForm = useForm<SenhaValues>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const magicForm = useForm<MagicValues>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  async function onSenhaSubmit(values: SenhaValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error("Não foi possível entrar", {
        description:
          error.code === "invalid_credentials"
            ? "E-mail ou senha incorretos. Confira os dados e tente de novo."
            : "Algo deu errado. Tente novamente em instantes.",
      });
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function onMagicSubmit(values: MagicValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        shouldCreateUser: false, // cadastro só por convite (H0.1/H0.2)
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      toast.error("Não foi possível enviar o link", {
        description:
          error.code === "otp_disabled" || error.status === 422
            ? "Este e-mail não tem acesso à plataforma. Peça um convite ao gestor."
            : "Algo deu errado. Tente novamente em instantes.",
      });
      return;
    }

    setMagicSent(values.email);
  }

  async function onRecoverPassword() {
    const email = senhaForm.getValues("email").trim();
    const valid = emailSchema.safeParse(email);
    if (!valid.success) {
      senhaForm.setError("email", {
        message: "Informe seu e-mail acima para recuperar a senha.",
      });
      senhaForm.setFocus("email");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/atualizar-senha`,
    });

    if (error) {
      toast.error("Não foi possível iniciar a recuperação", {
        description: "Tente novamente em instantes.",
      });
      return;
    }

    toast.success("Verifique seu e-mail", {
      description: `Se ${email} tiver cadastro, você receberá um link para redefinir a senha.`,
    });
  }

  if (magicSent) {
    return (
      <div
        role="status"
        className="rounded-xl border bg-card p-6 text-center shadow-sm"
      >
        <MailCheck
          aria-hidden
          className="mx-auto size-10 text-status-disponivel-fg"
        />
        <h2 className="mt-4 text-lg font-semibold">Link enviado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de acesso para{" "}
          <span className="font-medium text-foreground">{magicSent}</span>.
          Abra o e-mail neste aparelho para entrar.
        </p>
        <Button
          variant="ghost"
          className="mt-4 h-11"
          onClick={() => setMagicSent(null)}
        >
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="senha">
      <TabsList className="grid h-11 w-full grid-cols-2">
        <TabsTrigger value="senha" className="h-9">
          E-mail e senha
        </TabsTrigger>
        <TabsTrigger value="magic" className="h-9">
          Link mágico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="senha" className="mt-6">
        <Form {...senhaForm}>
          <form
            onSubmit={senhaForm.handleSubmit(onSenhaSubmit)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={senhaForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nome@empresa.com.br"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={senhaForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Senha</FormLabel>
                    <button
                      type="button"
                      onClick={onRecoverPassword}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-11 pr-12"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden className="size-4" />
                        ) : (
                          <Eye aria-hidden className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={senhaForm.formState.isSubmitting}
            >
              {senhaForm.formState.isSubmitting ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="magic" className="mt-6">
        <Form {...magicForm}>
          <form
            onSubmit={magicForm.handleSubmit(onMagicSubmit)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={magicForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nome@empresa.com.br"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Você recebe um link de acesso por e-mail — sem precisar de
                    senha.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={magicForm.formState.isSubmitting}
            >
              {magicForm.formState.isSubmitting ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Enviando link…
                </>
              ) : (
                "Enviar link de acesso"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
