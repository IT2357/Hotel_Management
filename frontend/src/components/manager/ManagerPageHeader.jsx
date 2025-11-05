import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { MANAGER_SECTION_CLASS } from "@/pages/manager/managerStyles";

const chipClass = "rounded-full bg-gradient-to-r from-teal-100 to-teal-50 px-4 py-1.5 text-xs font-bold tracking-wider text-teal-700 shadow-sm border border-teal-200";
const footerClass = "flex items-center gap-2 rounded-full bg-white border-2 border-gray-200 px-4 py-2 text-xs text-gray-700 font-medium shadow-sm";

const ManagerPageHeader = ({
  title,
  subtitle,
  accentChips = [],
  actions,
  footerChips = [],
  className = "",
}) => (
  <motion.section
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`${MANAGER_SECTION_CLASS} relative overflow-hidden bg-gradient-to-br from-white to-gray-50 ${className}`.trim()}
  >
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top,rgba(212,225,87,0.15),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-6%] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_65%)] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(44,62,80,0.03),transparent_50%)]" />
    </div>

    <div className="relative z-10 space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          {accentChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider">
              {accentChips.map((chip, index) => (
                <span key={index} className={chipClass}>
                  {chip}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent md:text-5xl">{title}</h1>
            {subtitle && <p className="text-base text-gray-600 font-medium md:text-lg">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>

      {footerChips.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {footerChips.map((item, index) => (
            <span key={index} className={footerClass}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  </motion.section>
);

ManagerPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  accentChips: PropTypes.arrayOf(PropTypes.node),
  actions: PropTypes.node,
  footerChips: PropTypes.arrayOf(PropTypes.node),
  className: PropTypes.string,
};

export default ManagerPageHeader;