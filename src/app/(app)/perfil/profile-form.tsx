"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function makeSchema(isBroker: boolean) {
  return z.object({
    full_name: z
      .string()
      .trim()
      .min(3, "Informe seu nome completo.")
      .max(120, "Nome muito longo."),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}$/,
        "Use o formato (47) 99999-9999.",
      )
      .or(z.literal("")),
    creci: isBroker
      ? z
          .string()
          .trim()
          .min(1, "O CRECI é obrigatório para corretores.")
          .regex(
            /^\d{3,6}(-?[FJfj])?$/,
            "Use o formato do conselho, como 12345-F.",
          )
      : z
          .string()
          .trim()
          .regex(/^\d{3,6}(-?[FJfj])?$/, "Use o formato do conselho, como 12345-F.")
          .or(z.literal("")),
  });
}

type Values = z.infer<ReturnType<typeof makeSchema>>;

export function ProfileForm({
  profile,
  isBroker,
}: {
  profile: Values;
  isBroker: boolean;
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(makeSchema(isBroker)),
    defaultValues: profile,
    mode: "onBlur",
  });

  async function onSubmit(values: Values) {
    const result = await updateProfile({
      ...values,
      creci: values.creci.toUpperCase(),
    });

    if (!result.ok) {
      toast.error("Não foi possível salvar", { description: result.error });
      return;
    }

    toast.success("Perfil atualizado");
    form.reset(values);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome completo{" "}
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone / WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="(47) 99999-9999"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creci"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CRECI{" "}
                    {isBroker ? (
                      <span aria-hidden className="text-destructive">
                        *
                      </span>
                    ) : null}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345-F"
                      className="num h-11 max-w-48"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Número do seu registro no conselho, com o sufixo F (física)
                    ou J (jurídica).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                className="h-11"
                disabled={
                  form.formState.isSubmitting || !form.formState.isDirty
                }
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
