import * as React from "react";

import {
  ManagerToastProvider,
  ManagerToastViewport,
  ManagerToast,
  ManagerToastTitle,
  ManagerToastDescription,
  ManagerToastClose,
  useManagerToast,
} from "./ManagerToast";

const ManagerToaster = () => {
  const { toasts } = useManagerToast();

  return (
    <ManagerToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <ManagerToast key={id} {...props}>
          <div className="grid gap-1">
            {title ? <ManagerToastTitle>{title}</ManagerToastTitle> : null}
            {description ? <ManagerToastDescription>{description}</ManagerToastDescription> : null}
          </div>
          {action}
          <ManagerToastClose />
        </ManagerToast>
      ))}
      <ManagerToastViewport />
    </ManagerToastProvider>
  );
};

export default ManagerToaster;
