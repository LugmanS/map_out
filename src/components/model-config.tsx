import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useModelStore } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Brain } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "./ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  baseURL: z.httpUrl(),
  apiKey: z.string(),
  modelId: z.string().min(1, "Model name is required"),
});

export function ModelConfig() {
  const { config, setConfig } = useModelStore();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      modelId: config.modelId,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setConfig(data);
    setOpen(false);
    toast.success("Model configuration updated");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogTrigger className="border flex items-center gap-1.5 px-2 py-1 rounded-md">
        <Brain className="size-4" />
        <p className="text-sm">{config.modelId}</p>
      </DialogTrigger>
      <form id="form-model-config" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Model Configuration</DialogTitle>
            <DialogDescription>
              Configure your OpenAI Chat Completions compatible LLM provider
              details.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="baseURL"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-base-url">Base URL</FieldLabel>
                  <Input
                    {...field}
                    id="form-base-url"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                  />
                  <FieldDescription>
                    OpenAI Chat Completions compatible endpoint.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="apiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-api-key">API Key</FieldLabel>
                  <Input
                    {...field}
                    id="form-api-key"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="modelId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-model-id">Model Id</FieldLabel>
                  <Input
                    {...field}
                    id="form-model-id"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="">
            <Field orientation="horizontal" className="justify-end">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" form="form-model-config">
                Save changes
              </Button>
            </Field>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
