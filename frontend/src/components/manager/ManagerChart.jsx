import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = {
  light: {
    text: "#0f172a",
    background: "#ffffff",
    grid: "#e2e8f0",
    tooltip: "#0f172a",
    legend: "#1e293b",
  },
  dark: {
    text: "#e2e8f0",
    background: "#0f172a",
    grid: "#1f2937",
    tooltip: "#f8fafc",
    legend: "#cbd5f5",
  },
};

function getTheme(theme) {
  if (!theme) return THEMES.light;
  if (typeof theme === "string") {
    return THEMES[theme] || THEMES.light;
  }
  const merged = { ...THEMES.light };
  Object.entries(theme).forEach(([key, value]) => {
    if (value) {
      merged[key] = value;
    }
  });
  return merged;
}

const ChartContext = React.createContext({ theme: THEMES.light });

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

const ChartContainer = React.forwardRef(({ children, className, config = {}, theme, ...props }, ref) => {
  const chartConfig = React.useMemo(
    () =>
      Object.entries(config || {}).reduce((acc, [key, value]) => {
        acc[key] = {
          label: value?.label,
          icon: value?.icon,
          color: value?.color ?? value?.colour,
        };
        return acc;
      }, {}),
    [config],
  );

  const currentTheme = getTheme(theme);

  return (
    <ChartContext.Provider value={{ config: chartConfig, theme: currentTheme }}>
      <div ref={ref} className={cn("flex aspect-video h-full min-h-[200px] w-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

function ChartStyle({ id }) {
  const { config, theme } = useChart();

  const resolved = React.useMemo(
    () =>
      Object.entries(config || {}).map(([key, value]) => {
        const colour = value.colour;
        if (!colour) return null;

        const [r, g, b] = colour.match(/\w{2}/g)?.map((hex) => parseInt(hex, 16)) || [0, 0, 0];
        const rgb = `${r} ${g} ${b}`;
  return { id: key, color: colour, rgb };
      }),
    [config],
  );

  return (
    <style>
      {`
        :root {
          --chart-text: ${theme.text};
          --chart-background: ${theme.background};
          --chart-grid: ${theme.grid};
          --chart-tooltip: ${theme.tooltip};
          --chart-legend: ${theme.legend};
        }
        ${resolved
          .filter(Boolean)
          .map((item) => `
            [data-chart-id="${item.id}"] {
              --chart-${item.id}: ${item.color};
              --chart-${item.id}-rgb: ${item.rgb};
            }
          `)
          .join("\n")}
      `}
    </style>
  );
}

const ChartTooltip = React.forwardRef(({ cursor, labelFormatter, formatter, className, ...props }, ref) => {
  const { config } = useChart();
  return (
    <RechartsPrimitive.Tooltip
      ref={ref}
      cursor={{ stroke: "var(--chart-grid)", ...(cursor || {}) }}
      content={({ active: isActive, payload: currentPayload, label: currentLabel }) => {
        if (!isActive || !currentPayload?.length) {
          return null;
        }

        const valueFormatter = formatter || ((value) => String(value));
        const formattedLabel = labelFormatter ? labelFormatter(currentLabel) : currentLabel;

        return (
          <div className={cn("rounded-md border border-slate-200 bg-white p-3 shadow-sm", className)} {...props}>
            {formattedLabel && <div className="mb-2 text-sm font-medium text-slate-600">{formattedLabel}</div>}
            <div className="grid gap-1">
              {currentPayload.map((entry, index) => {
                const { dataKey, value, color } = entry;
                const configItem = dataKey ? config?.[dataKey] : null;
                const labelText = configItem?.label || dataKey;
                const Icon = configItem?.icon;
                const formatted = valueFormatter(value, dataKey, entry, index);

                return (
                  <div key={dataKey} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    {Icon ? <Icon className="h-3 w-3" /> : null}
                    <span className="font-medium">{labelText}</span>
                    <span className="text-slate-500">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
      {...props}
    />
  );
});
ChartTooltip.displayName = "ChartTooltip";

const ChartLegend = React.forwardRef(({ content, className, payload, formatter, ...props }, ref) => {
  const { config } = useChart();

  return (
    <RechartsPrimitive.Legend
      ref={ref}
      content={({ payload: currentPayload }) => {
        if (!currentPayload?.length) {
          return null;
        }

        return (
          <div className={cn("flex flex-wrap items-center gap-3 text-sm text-slate-600", className)} {...props}>
            {currentPayload.map((entry) => {
              const { dataKey, color } = entry;
              const configItem = dataKey ? config?.[dataKey] : null;
              const labelText = configItem?.label || dataKey;
              const Icon = configItem?.icon;
              const formatted = formatter ? formatter(labelText, dataKey, entry) : labelText;

              return (
                <div key={dataKey} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {Icon ? <Icon className="h-3 w-3" /> : null}
                  <span>{formatted}</span>
                </div>
              );
            })}
          </div>
        );
      }}
      {...props}
    />
  );
});
ChartLegend.displayName = "ChartLegend";

const ChartArea = React.forwardRef(({ fillOpacity = 0.4, fill, stroke, dataKey, name, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = fill || configItem?.color || `var(--chart-${String(dataKey)})`;
  const resolvedStroke = stroke || color;

  return (
    <RechartsPrimitive.Area
      ref={ref}
      dataKey={dataKey}
      name={name || configItem?.label}
      fill={color}
      fillOpacity={fillOpacity}
      stroke={resolvedStroke}
      strokeWidth={2}
      type="monotone"
      dot={false}
      activeDot={{ r: 4 }}
      {...props}
    />
  );
});
ChartArea.displayName = "ChartArea";

const ChartBar = React.forwardRef(({ fill, dataKey, name, radius = [4, 4, 0, 0], background, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = fill || configItem?.color || `var(--chart-${String(dataKey)})`;

  return (
    <RechartsPrimitive.Bar
      ref={ref}
      dataKey={dataKey}
      name={name || configItem?.label}
      fill={color}
      radius={radius}
      background={background}
      {...props}
    />
  );
});
ChartBar.displayName = "ChartBar";

const ChartLine = React.forwardRef(({ stroke, dataKey, name, strokeWidth = 2, dot = false, activeDot = { r: 4 }, type = "monotone", ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = stroke || configItem?.color || `var(--chart-${String(dataKey)})`;

  return (
    <RechartsPrimitive.Line
      ref={ref}
      type={type}
      dataKey={dataKey}
      name={name || configItem?.label}
      stroke={color}
      strokeWidth={strokeWidth}
      dot={dot}
      activeDot={activeDot}
      {...props}
    />
  );
});
ChartLine.displayName = "ChartLine";

const ChartPie = React.forwardRef(({ fill, dataKey, nameKey, cx = "50%", cy = "50%", innerRadius, outerRadius, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  return (
    <RechartsPrimitive.Pie
      ref={ref}
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      dataKey={dataKey}
      nameKey={nameKey}
      fill={fill || configItem?.color || `var(--chart-${String(dataKey)})`}
      {...props}
    />
  );
});
ChartPie.displayName = "ChartPie";

const ChartRadar = React.forwardRef(({ stroke, fill, dataKey, nameKey, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = fill || configItem?.color || `var(--chart-${String(dataKey)})`;

  return (
    <RechartsPrimitive.Radar
      ref={ref}
      dataKey={dataKey}
      nameKey={nameKey}
      stroke={stroke || color}
      fill={color}
      fillOpacity={0.6}
      {...props}
    />
  );
});
ChartRadar.displayName = "ChartRadar";

const ChartRadialBar = React.forwardRef(({ fill, dataKey, nameKey, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = fill || configItem?.color || `var(--chart-${String(dataKey)})`;

  return (
    <RechartsPrimitive.RadialBar
      ref={ref}
      fill={color}
      dataKey={dataKey}
      nameKey={nameKey}
      {...props}
    />
  );
});
ChartRadialBar.displayName = "ChartRadialBar";

const ChartScatter = React.forwardRef(({ fill, dataKey, name, ...props }, ref) => {
  const { config } = useChart();
  const configItem = dataKey ? config?.[dataKey] : null;
  const color = fill || configItem?.color || `var(--chart-${String(dataKey)})`;

  return (
    <RechartsPrimitive.Scatter
      ref={ref}
      dataKey={dataKey}
      name={name || configItem?.label}
      fill={color}
      {...props}
    />
  );
});
ChartScatter.displayName = "ChartScatter";

const ChartReferenceLine = React.forwardRef(({ stroke, ...props }, ref) => {
  return (
    <RechartsPrimitive.ReferenceLine
      ref={ref}
      stroke={stroke || "var(--chart-grid)"}
      strokeDasharray="3 3"
      {...props}
    />
  );
});
ChartReferenceLine.displayName = "ChartReferenceLine";

const ChartReferenceArea = React.forwardRef(({ fill, ...props }, ref) => {
  return (
    <RechartsPrimitive.ReferenceArea
      ref={ref}
      fill={fill || "var(--chart-grid)"}
      fillOpacity={0.2}
      {...props}
    />
  );
});
ChartReferenceArea.displayName = "ChartReferenceArea";

const ChartBrush = React.forwardRef((props, ref) => {
  return <RechartsPrimitive.Brush ref={ref} {...props} />;
});
ChartBrush.displayName = "ChartBrush";

const ChartCartesianGrid = React.forwardRef(({ stroke, ...props }, ref) => {
  return <RechartsPrimitive.CartesianGrid ref={ref} stroke={stroke || "var(--chart-grid)"} strokeDasharray="4" {...props} />;
});
ChartCartesianGrid.displayName = "ChartCartesianGrid";

const ChartXAxis = React.forwardRef(({ stroke, tickLine = true, axisLine = true, dy = 16, tickMargin = 8, ...props }, ref) => {
  return (
    <RechartsPrimitive.XAxis
      ref={ref}
      stroke={stroke || "var(--chart-grid)"}
      tickLine={tickLine}
      axisLine={axisLine}
      dy={dy}
      tickMargin={tickMargin}
      {...props}
    />
  );
});
ChartXAxis.displayName = "ChartXAxis";

const ChartYAxis = React.forwardRef(({ stroke, tickLine = true, axisLine = true, dx = -16, tickMargin = 8, ...props }, ref) => {
  return (
    <RechartsPrimitive.YAxis
      ref={ref}
      stroke={stroke || "var(--chart-grid)"}
      tickLine={tickLine}
      axisLine={axisLine}
      dx={dx}
      tickMargin={tickMargin}
      {...props}
    />
  );
});
ChartYAxis.displayName = "ChartYAxis";

const ChartBrushSlide = React.forwardRef(({ className, ...props }, ref) => {
  return <RechartsPrimitive.BrushSlide ref={ref} className={cn("fill-[var(--chart-background)]", className)} {...props} />;
});
ChartBrushSlide.displayName = "ChartBrushSlide";

const ChartTooltipContent = React.forwardRef(
  ({ className, indicator = "dot", hideLabel = false, labelFormatter, payload = [], label, active }, ref) => {
    const { config, theme } = useChart();

    if (!active || !payload.length) {
      return null;
    }

    const formattedLabel = labelFormatter ? labelFormatter(label) : label;

    return (
      <div ref={ref} className={cn("min-w-[8rem] rounded-md border border-slate-200 bg-white p-3 shadow", className)}>
        {!hideLabel && formattedLabel && (
          <div className="mb-2 text-sm font-medium text-slate-600">{formattedLabel}</div>
        )}
        <div className="grid gap-2">
          {payload.map((item) => {
            const configItem = item?.dataKey ? config?.[item.dataKey] : null;
            const labelText = configItem?.label || item?.name || item?.dataKey;
            const Icon = configItem?.icon;

            return (
              <div key={item?.dataKey} className="flex items-center gap-2 text-sm text-slate-700">
                {indicator === "dot" ? (
                  <span className="h-2 w-2 rounded-full" style={{ background: item?.color || theme.text }} />
                ) : (
                  <span className="h-3 w-px bg-slate-400" />
                )}
                {Icon ? <Icon className="h-3 w-3" /> : null}
                <span className="font-medium">{labelText}</span>
                {item?.value != null ? (
                  <span className="ml-auto text-slate-500">{item.value}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartTooltipIndicator = ({ indicator = "dot" }) => {
  if (indicator === "line") {
    return <span className="h-3 w-px bg-slate-400" />;
  }
  return <span className="h-2 w-2 rounded-full bg-slate-400" />;
};

const ChartLegendContent = ({ className, payload = [] }) => {
  const { config } = useChart();

  if (!payload.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-sm text-slate-600", className)}>
      {payload.map((item) => {
        const configItem = item?.dataKey ? config?.[item.dataKey] : null;
        const labelText = configItem?.label || item?.value || item?.dataKey;
        const Icon = configItem?.icon;

        return (
          <div key={item?.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: item?.color }} />
            {Icon ? <Icon className="h-3 w-3" /> : null}
            <span>{labelText}</span>
          </div>
        );
      })}
    </div>
  );
};

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartLegend,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartPie,
  ChartRadar,
  ChartRadialBar,
  ChartScatter,
  ChartReferenceLine,
  ChartReferenceArea,
  ChartBrush,
  ChartCartesianGrid,
  ChartXAxis,
  ChartYAxis,
  ChartBrushSlide,
  ChartTooltipContent,
  ChartTooltipIndicator,
  ChartLegendContent,
};
