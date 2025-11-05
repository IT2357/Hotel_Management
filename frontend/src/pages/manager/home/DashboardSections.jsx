/**
 * Dashboard Section Components
 * Insights, Actions, Workforce, Trends, Team, and Sentiment sections
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SummaryCards } from "@/components/manager/SummaryCards";
import { StaffPerformanceChart } from "@/components/manager/StaffPerformanceChart";
import { StaffList } from "@/components/manager/StaffList";
import { FeedbackSummary } from "@/components/manager/FeedbackSummary";
import { Button } from "@/components/manager/ManagerButton";
import { Gauge, Activity, TrendingUp } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { cx, STAT_CARD_CLASS, STAT_CARD_VARIANTS } from "./constants";

export const SummarySection = ({ summaryCards, isDataLoading }) => (
  <div className={isDataLoading ? "animate-pulse" : ""}>
    <SummaryCards cards={summaryCards} />
  </div>
);

export const InsightsSection = ({ insights }) => (
  <SectionCard variant="insights" className="xl:col-span-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Operational insights
        </h3>
        <p className="text-sm text-gray-600 font-medium">Key signals refreshed automatically.</p>
      </div>
      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
        <Gauge className="h-6 w-6 text-amber-700" />
      </div>
    </div>
    <ul className="mt-5 space-y-4">
      {insights.map((insight) => (
        <li key={insight.label} className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.neutral)}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{insight.label}</span>
            <span
              className={`text-sm font-semibold ${
                insight.intent === "positive"
                  ? "text-emerald-600"
                  : insight.intent === "warning"
                  ? "text-amber-600"
                  : "text-teal-600"
              }`}
            >
              {insight.value}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">{insight.message}</p>
        </li>
      ))}
    </ul>
  </SectionCard>
);

export const ActionsSection = ({ nextActions }) => (
  <SectionCard variant="actions" className="xl:col-span-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
          Next best actions
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          Focus the team on the highest impact tasks.
        </p>
      </div>
      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 shadow-sm">
        <Activity className="h-6 w-6 text-emerald-700" />
      </div>
    </div>
    <ul className="mt-5 space-y-4">
      {nextActions.map((action) => (
        <li key={action.title} className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.actions)}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{action.title}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {action.priority} priority
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">{action.description}</p>
        </li>
      ))}
    </ul>
  </SectionCard>
);

export const WorkforceSection = ({ workforceSnapshot, isDataLoading, formatLastUpdated }) => (
  <SectionCard variant="workforce" className="xl:col-span-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          Workforce load
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          Live coverage versus active work items.
        </p>
      </div>
      <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 shadow-sm">
        <TrendingUp className="h-6 w-6 text-teal-700" />
      </div>
    </div>

    <dl className="mt-5 space-y-4 text-sm text-gray-900">
      <div
        className={cx(
          STAT_CARD_CLASS,
          STAT_CARD_VARIANTS.workforce,
          "flex items-center justify-between"
        )}
      >
        <dt className="text-gray-600">Team online</dt>
        <dd className="font-semibold">{isDataLoading ? "—" : workforceSnapshot.online}</dd>
      </div>
      <div
        className={cx(
          STAT_CARD_CLASS,
          STAT_CARD_VARIANTS.workforce,
          "flex items-center justify-between"
        )}
      >
        <dt className="text-gray-600">Active load</dt>
        <dd className="font-semibold">{isDataLoading ? "—" : workforceSnapshot.workload}</dd>
      </div>
      <div
        className={cx(
          STAT_CARD_CLASS,
          STAT_CARD_VARIANTS.workforce,
          "flex items-center justify-between"
        )}
      >
        <dt className="text-gray-600">Tasks per team member</dt>
        <dd className="font-semibold">
          {isDataLoading ? "—" : workforceSnapshot.online ? workforceSnapshot.coverage : "-"}
        </dd>
      </div>
    </dl>
    <p className="mt-4 text-xs text-gray-500">
      {isDataLoading ? "Syncing the latest metrics..." : workforceSnapshot.status}
    </p>
    <p className="mt-2 text-xs text-gray-400">Last sync: {formatLastUpdated()}</p>
  </SectionCard>
);

export const TrendsSection = ({ trendQuickStats, cx, STAT_CARD_CLASS, STAT_CARD_VARIANTS }) => (
  <SectionCard variant="trends" className="xl:col-span-7">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Performance Trends
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          Track staff efficiency, response times, and service quality.
        </p>
      </div>
      <Button
        asChild
        variant="ghost"
        className="text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl px-4 py-2"
      >
        <Link to="/manager/reports">Open detailed reports</Link>
      </Button>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      {trendQuickStats.map((item) => (
        <div key={item.label} className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.trends)}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">{item.label}</p>
          <p className={`mt-2 text-lg font-semibold ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
    <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.trends)}>
      <StaffPerformanceChart />
    </div>
  </SectionCard>
);

export const TeamSection = ({ teamPulseStats }) => (
  <SectionCard variant="team">
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Team Pulse
      </h3>
      <Button
        asChild
        variant="ghost"
        className="text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-2"
      >
        <Link to="/manager/profile">View roster</Link>
      </Button>
    </div>
    <p className="text-sm text-gray-600 font-medium">
      Top performers and availability based on real-time updates.
    </p>
    <dl className="mt-5 grid gap-4 sm:grid-cols-3">
      {teamPulseStats.map((stat) => (
        <div key={stat.label} className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.team)}>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-600">
            {stat.label}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-gray-900">{stat.value}</dd>
        </div>
      ))}
    </dl>
    <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.team)}>
      <StaffList />
    </div>
  </SectionCard>
);

export const SentimentSection = ({ sentimentSummary }) => (
  <SectionCard variant="sentiment">
    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
      Guest Sentiment
    </h3>
    <p className="text-sm text-gray-600 font-medium">
      Highlights from the latest service reviews and feedback.
    </p>
    <div className={cx(STAT_CARD_CLASS, STAT_CARD_VARIANTS.sentiment, "mt-5")}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Current rating</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{sentimentSummary.rating}</p>
      <p className="mt-3 text-sm text-gray-500">{sentimentSummary.status}</p>
    </div>
    <div className={cx("mt-6 rounded-2xl border p-4", STAT_CARD_VARIANTS.sentiment)}>
      <FeedbackSummary />
    </div>
  </SectionCard>
);
