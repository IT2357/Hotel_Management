//src/utils/getDashboardPath

const getDashboardPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "manager":
      return "/manager/dashboard";
    case "staff":
      return "/staff/dashboard";
    case "guest":
      return "/";
    default:
      return "/";
  }
};

export default getDashboardPath;
