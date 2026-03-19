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
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "./ui/button";

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
      <DialogTrigger asChild>
        <Button variant={"outline"} size={"sm"} className="gap-1.5">
          <Brain className="size-4" />
          {config.modelId}
        </Button>
      </DialogTrigger>
      <form id="form-model-config" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Model Configuration</DialogTitle>
            <DialogDescription>
              Configure any OpenAI SDK-compatible provider.
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
                    Must be an OpenAI SDK–compatible endpoint with CORS enabled.
                    If your provider blocks browser requests, use{" "}
                    <a href="https://openrouter.ai" target="_blank">
                      OpenRouter
                    </a>{" "}
                    or another compatible gateway.
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
