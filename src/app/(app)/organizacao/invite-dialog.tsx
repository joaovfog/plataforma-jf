"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { inviteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo."),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Digite um e-mail válido."),
  role: z.enum(["org_admin", "manager", "broker"], {
    message: "Escolha o papel do convidado.",
  }),
});

type Values = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  {
    value: "broker",
    label: "Corretor",
    hint: "Acessa catálogo, espelho e reservas",
  },
  {
    value: "manager",
    label: "Gestor",
    hint: "Gerencia a equipe e acompanha a operação",
  },
  {
    value: "org_admin",
    label: "Administrador",
    hint: "Controle total da organização",
  },
] as const;

export function InviteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", role: "broker" },
    mode: "onBlur",
  });

  async function onSubmit(values: Values) {
    const result = await inviteUser(values);

    if (!result.ok) {
      toast.error("Convite não enviado", { description: result.error });
      return;
    }

    toast.success("Convite enviado", {
      description: `${values.full_name} recebe um e-mail para definir a senha no primeiro acesso.`,
    });
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11">
          <UserPlus aria-hidden className="size-4" />
          Convidar membro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar membro da equipe</DialogTitle>
          <DialogDescription>
            O convidado recebe um link mágico por e-mail e define a senha no
            primeiro acesso. O convite já carrega o papel escolhido.
          </DialogDescription>
        </DialogHeader>

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
                    <Input autoComplete="off" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    E-mail{" "}
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
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
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Papel{" "}
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Escolha o papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <span className="font-medium">{r.label}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            — {r.hint}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar convite"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
