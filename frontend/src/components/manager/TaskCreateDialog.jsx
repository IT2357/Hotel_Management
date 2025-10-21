import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import {
  ManagerDialog,
  ManagerDialogContent,
  ManagerDialogDescription,
  ManagerDialogFooter,
  ManagerDialogHeader,
  ManagerDialogTitle,
} from "@/components/manager/ManagerDialog";
import {
  ManagerForm,
  ManagerFormControl,
  ManagerFormField,
  ManagerFormItem,
  ManagerFormLabel,
  ManagerFormMessage,
} from "@/components/manager/ManagerForm";
import { ManagerInput } from "@/components/manager/ManagerInput";
import {
  ManagerSelect,
  ManagerSelectContent,
  ManagerSelectItem,
  ManagerSelectTrigger,
  ManagerSelectValue,
} from "@/components/manager/ManagerSelect";
import { Button } from "@/components/manager/ManagerButton";
import { cn } from "@/lib/utils";

const textareaClasses = "min-h-[120px] w-full rounded-md border border-[#1b335f] bg-[#0b1f3f] px-3 py-2 text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

export const TaskCreateDialog = ({
  open,
  onOpenChange,
  onCreate,
  departmentOptions = [],
  priorityOptions = [],
}) => {
  const fallbackDepartment = departmentOptions[0]?.value ?? "service";
  const fallbackPriority = priorityOptions[0]?.value ?? "medium";

  const defaults = useMemo(
    () => ({
      title: "",
      department: fallbackDepartment,
      priority: fallbackPriority,
      dueDate: "",
      estimatedDuration: "",
      location: "",
      roomNumber: "",
      description: "",
      managerNote: "",
    }),
    [fallbackDepartment, fallbackPriority],
  );

  const form = useForm({ defaultValues: defaults });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset(defaults);
    }
  }, [open, defaults, form]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!onCreate) {
      toast.error("Task creation unavailable", {
        description: "No handler provided to create a task.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(values);
      form.reset(defaults);
      onOpenChange(false);
    } catch (error) {
      const message = error?.message || "Failed to create task";
      toast.error("Unable to create task", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <ManagerDialog open={open} onOpenChange={onOpenChange}>
      <ManagerDialogContent className="w-full max-w-2xl border-[#1b335f] bg-[#06122b] text-[#d6e2ff]">
        <ManagerDialogHeader>
          <ManagerDialogTitle className="text-[#f5f7ff]">Create Task</ManagerDialogTitle>
          <ManagerDialogDescription className="text-[#8ba3d0]">
            Capture the essentials below to dispatch a new task to your team.
          </ManagerDialogDescription>
        </ManagerDialogHeader>

        <ManagerForm {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ManagerFormField
                control={form.control}
                name="title"
                rules={{ required: "A task title is required." }}
                render={({ field }) => (
                  <ManagerFormItem className="sm:col-span-2">
                    <ManagerFormLabel>Title</ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        placeholder="Brief summary, e.g. Deep clean suite 402"
                        className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0]"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="department"
                rules={{ required: "Select a department." }}
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Department</ManagerFormLabel>
                    <ManagerSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <ManagerFormControl>
                        <ManagerSelectTrigger className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff]">
                          <ManagerSelectValue placeholder="Choose department" />
                        </ManagerSelectTrigger>
                      </ManagerFormControl>
                      <ManagerSelectContent className="border-[#1b335f] bg-[#0f203f] text-[#d6e2ff]">
                        {departmentOptions.map((option) => (
                          <ManagerSelectItem key={option.value} value={option.value} className="focus:bg-[#132b4f] focus:text-[#f5f7ff]">
                            {option.label}
                          </ManagerSelectItem>
                        ))}
                      </ManagerSelectContent>
                    </ManagerSelect>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="priority"
                rules={{ required: "Select a priority." }}
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Priority</ManagerFormLabel>
                    <ManagerSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <ManagerFormControl>
                        <ManagerSelectTrigger className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff]">
                          <ManagerSelectValue placeholder="Select priority" />
                        </ManagerSelectTrigger>
                      </ManagerFormControl>
                      <ManagerSelectContent className="border-[#1b335f] bg-[#0f203f] text-[#d6e2ff]">
                        {priorityOptions.map((option) => (
                          <ManagerSelectItem key={option.value} value={option.value} className="focus:bg-[#35131f] focus:text-[#f5f7ff]">
                            {option.label}
                          </ManagerSelectItem>
                        ))}
                      </ManagerSelectContent>
                    </ManagerSelect>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Due Date</ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        type="datetime-local"
                        className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0]"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Estimated Duration (minutes)</ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        type="number"
                        min={0}
                        step={5}
                        placeholder="e.g. 45"
                        className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0]"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Location</ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        placeholder="Lobby, west wing, poolside setup..."
                        className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0]"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel>Room Number</ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        placeholder="Optional"
                        className="border-[#1b335f] bg-[#0b1f3f] text-sm text-[#d6e2ff] placeholder:text-[#5f7ac0]"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage />
                  </ManagerFormItem>
                )}
              />
            </div>

            <ManagerFormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <ManagerFormItem>
                  <ManagerFormLabel>Description</ManagerFormLabel>
                  <ManagerFormControl>
                    <textarea
                      {...field}
                      className={cn(textareaClasses)}
                      placeholder="Add context, access instructions, or special requests for the assignee."
                    />
                  </ManagerFormControl>
                  <ManagerFormMessage />
                </ManagerFormItem>
              )}
            />

            <ManagerFormField
              control={form.control}
              name="managerNote"
              render={({ field }) => (
                <ManagerFormItem>
                  <ManagerFormLabel>Manager Notes (internal)</ManagerFormLabel>
                  <ManagerFormControl>
                    <textarea
                      {...field}
                      className={cn(textareaClasses, "min-h-[80px]")}
                      placeholder="Optional quick note for assignment history."
                    />
                  </ManagerFormControl>
                  <ManagerFormMessage />
                </ManagerFormItem>
              )}
            />

            <ManagerDialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-[#1b335f] bg-[#0b1f3f] text-[#d6e2ff] hover:bg-[#142b52]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#facc15] text-[#0b1b3c] hover:bg-[#f9c513] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create task
              </Button>
            </ManagerDialogFooter>
          </form>
        </ManagerForm>
      </ManagerDialogContent>
    </ManagerDialog>
  );
};
