import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { MANAGER_SECTION_CLASS } from "@/pages/manager/managerStyles";

const chipClass = "rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-semibold tracking-wide text-white/70";
const footerClass = "flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60";

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
    className={`${MANAGER_SECTION_CLASS} relative overflow-hidden ${className}`.trim()}
  >
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),transparent_60%)] blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_55%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(15,23,42,0)_35%,rgba(255,255,255,0.05)_70%)] opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_32px] opacity-20" />
    </div>

    <div className="relative z-10 space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          {accentChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/70">
              {accentChips.map((chip, index) => (
                <span key={index} className={chipClass}>
                  {chip}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white md:text-4xl">{title}</h1>
            {subtitle && <p className="text-sm text-white/70 md:text-base">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>

      {footerChips.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-white/65">
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