"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Use ao menos 8 caracteres.")
      .regex(/[a-zA-Z]/, "Inclua ao menos uma letra.")
      .regex(/\d/, "Inclua ao menos um número."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem.",
  });

type Values = z.infer<typeof schema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: Values) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error("Não foi possível salvar a senha", {
        description:
          error.code === "same_password"
            ? "A nova senha precisa ser diferente da atual."
            : "Tente novamente em instantes.",
      });
      return;
    }

    toast.success("Senha definida com sucesso");
    router.replace("/painel");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    className="h-11 pr-12"
                    {...field}
                  />
                  <button
                    type="button"
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShow((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {show ? (
                      <EyeOff aria-hidden className="size-4" />
                    ) : (
                      <Eye aria-hidden className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Mínimo de 8 caracteres, com letras e números.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Salvando…
            </>
          ) : (
            "Salvar e continuar"
          )}
        </Button>
      </form>
    </Form>
  );
}
