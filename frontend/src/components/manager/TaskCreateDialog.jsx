import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus, Clock, MapPin, Building2, Calendar, Timer, FileText, StickyNote } from "lucide-react";

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

const textareaClasses = "min-h-[120px] w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50";

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
      location: "other",
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
      <ManagerDialogContent className="w-full max-w-3xl border-none bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 text-gray-800 shadow-2xl">
        <ManagerDialogHeader className="border-b-2 border-cyan-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <ManagerDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Create New Task</ManagerDialogTitle>
              <ManagerDialogDescription className="text-gray-600 font-medium mt-1">
                Fill in the details to create and assign a task to your team
              </ManagerDialogDescription>
            </div>
          </div>
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
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      Task Title *
                    </ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        placeholder="Brief summary, e.g. Deep clean suite 402"
                        className="border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 h-12 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 transition-all"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="department"
                rules={{ required: "Select a department." }}
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-600" />
                      Department *
                    </ManagerFormLabel>
                    <ManagerSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <ManagerFormControl>
                        <ManagerSelectTrigger className="border-2 border-gray-200 bg-white text-sm text-gray-800 h-12 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 transition-all">
                          <ManagerSelectValue placeholder="Choose department" />
                        </ManagerSelectTrigger>
                      </ManagerFormControl>
                      <ManagerSelectContent className="border-2 border-gray-200 bg-white text-gray-800 shadow-xl rounded-xl">
                        {departmentOptions.map((option) => (
                          <ManagerSelectItem key={option.value} value={option.value} className="focus:bg-cyan-50 focus:text-cyan-900 rounded-lg font-medium">
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
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      Priority *
                    </ManagerFormLabel>
                    <ManagerSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <ManagerFormControl>
                        <ManagerSelectTrigger className="border-2 border-gray-200 bg-white text-sm text-gray-800 h-12 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all">
                          <ManagerSelectValue placeholder="Select priority" />
                        </ManagerSelectTrigger>
                      </ManagerFormControl>
                      <ManagerSelectContent className="border-2 border-gray-200 bg-white text-gray-800 shadow-xl rounded-xl">
                        {priorityOptions.map((option) => (
                          <ManagerSelectItem key={option.value} value={option.value} className="focus:bg-red-50 focus:text-red-900 rounded-lg font-medium">
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
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Due Date
                    </ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        type="datetime-local"
                        className="border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 h-12 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Timer className="h-4 w-4 text-orange-600" />
                      Estimated Duration (minutes)
                    </ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        type="number"
                        min={0}
                        step={5}
                        placeholder="e.g. 45"
                        className="border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 h-12 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="location"
                rules={{ required: "Location is required." }}
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      Location *
                    </ManagerFormLabel>
                    <ManagerSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <ManagerFormControl>
                        <ManagerSelectTrigger className="border-2 border-gray-200 bg-white text-sm text-gray-800 h-12 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all">
                          <ManagerSelectValue placeholder="Select location" />
                        </ManagerSelectTrigger>
                      </ManagerFormControl>
                      <ManagerSelectContent className="border-2 border-gray-200 bg-white text-gray-800 shadow-xl rounded-xl">
                        <ManagerSelectItem value="room" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Room</ManagerSelectItem>
                        <ManagerSelectItem value="kitchen" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Kitchen</ManagerSelectItem>
                        <ManagerSelectItem value="lobby" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Lobby</ManagerSelectItem>
                        <ManagerSelectItem value="gym" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Gym</ManagerSelectItem>
                        <ManagerSelectItem value="pool" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Pool</ManagerSelectItem>
                        <ManagerSelectItem value="parking" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Parking</ManagerSelectItem>
                        <ManagerSelectItem value="other" className="focus:bg-green-50 focus:text-green-900 rounded-lg font-medium">Other</ManagerSelectItem>
                      </ManagerSelectContent>
                    </ManagerSelect>
                    <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                  </ManagerFormItem>
                )}
              />

              <ManagerFormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <ManagerFormItem>
                    <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Room Number
                    </ManagerFormLabel>
                    <ManagerFormControl>
                      <ManagerInput
                        {...field}
                        placeholder="Optional"
                        className="border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 h-12 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    </ManagerFormControl>
                    <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                  </ManagerFormItem>
                )}
              />
            </div>

            <ManagerFormField
              control={form.control}
              name="description"
              rules={{ required: "Description is required." }}
              render={({ field }) => (
                <ManagerFormItem>
                  <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Description *
                  </ManagerFormLabel>
                  <ManagerFormControl>
                    <textarea
                      {...field}
                      className={cn(textareaClasses)}
                      placeholder="Add context, access instructions, or special requests for the assignee."
                    />
                  </ManagerFormControl>
                  <ManagerFormMessage className="text-red-600 text-xs font-medium" />
                </ManagerFormItem>
              )}
            />

            <ManagerFormField
              control={form.control}
              name="managerNote"
              render={({ field }) => (
                <ManagerFormItem>
                  <ManagerFormLabel className="text-gray-900 font-bold text-sm flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-yellow-600" />
                    Manager Notes (internal)
                  </ManagerFormLabel>
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

            <ManagerDialogFooter className="gap-3 pt-6 border-t-2 border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 h-12 rounded-xl font-bold transition-all shadow-sm"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 disabled:opacity-70 px-8 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </ManagerDialogFooter>
          </form>
        </ManagerForm>
      </ManagerDialogContent>
    </ManagerDialog>
  );
};
