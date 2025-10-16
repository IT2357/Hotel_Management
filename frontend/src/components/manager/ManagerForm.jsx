import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { ManagerLabel } from "@/components/manager/ManagerLabel";

const ManagerForm = FormProvider;

const ManagerFormFieldContext = React.createContext(undefined);
const ManagerFormItemContext = React.createContext(undefined);

const ManagerFormField = (props) => {
  const { name } = props;
  return (
    <ManagerFormFieldContext.Provider value={{ name }}>
      <Controller {...props} />
    </ManagerFormFieldContext.Provider>
  );
};

const useManagerFormField = () => {
  const fieldContext = React.useContext(ManagerFormFieldContext);
  const itemContext = React.useContext(ManagerFormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useManagerFormField must be used within a <ManagerFormField />");
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const id = itemContext?.id ?? fieldContext.name;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const ManagerFormItem = React.forwardRef(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <ManagerFormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </ManagerFormItemContext.Provider>
  );
});
ManagerFormItem.displayName = "ManagerFormItem";

const ManagerFormLabel = React.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useManagerFormField();

  return <ManagerLabel ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
});
ManagerFormLabel.displayName = "ManagerFormLabel";

const ManagerFormControl = React.forwardRef(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useManagerFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
});
ManagerFormControl.displayName = "ManagerFormControl";

const ManagerFormDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useManagerFormField();

  return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});
ManagerFormDescription.displayName = "ManagerFormDescription";

const ManagerFormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useManagerFormField();
  const body = error?.message ? String(error.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {body}
    </p>
  );
});
ManagerFormMessage.displayName = "ManagerFormMessage";

export {
  ManagerForm,
  ManagerFormField,
  useManagerFormField,
  ManagerFormItem,
  ManagerFormLabel,
  ManagerFormControl,
  ManagerFormDescription,
  ManagerFormMessage,
};
