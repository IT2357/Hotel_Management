// controllers/manager/performanceController.js
import Task from '../../models/manager/Task.js';
import Staff from '../../models/profiles/StaffProfile.js';

export const getPerformance = async (req, res) => {
  try {
    const { period = '7d', department } = req.query;
    let dateRange = {};
    const now = new Date();
    switch (period) {
      case '24h': dateRange = { $gte: new Date(now - 24 * 60 * 60 * 1000) }; break;
      case '7d': dateRange = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }; break;
      case '30d': dateRange = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) }; break;
    }
    let matchQuery = { createdAt: dateRange };
    if (department && department !== 'all') matchQuery.category = department;

    const [completionTrends, completionTimeByCategory, staffPerformance] = await Promise.all([
      Task.aggregate([{ $match: matchQuery }, {
        $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, status: "$status" }, count: { $sum: 1 } }
      }, { $sort: { "_id.date": 1 } }]),
      Task.aggregate([{ $match: { ...matchQuery, status: 'completed', actualTime: { $exists: true, $gt: 0 } } }, {
        $group: { _id: "$category", avgTime: { $avg: "$actualTime" }, count: { $sum: 1 } }
      }]),
      Task.aggregate([{ $match: { ...matchQuery, assignedTo: { $exists: true } } }, {
        $group: { _id: "$assignedTo", completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }, total: { $sum: 1 }, avgTime: { $avg: { $cond: [{ $ne: ["$actualTime", null] }, "$actualTime", 0] } } }
      }, {
        $lookup: { from: "staff", localField: "_id", foreignField: "_id", as: "staff" }
      }, { $unwind: "$staff" }, {
        $project: { name: "$staff.name", department: "$staff.department", completed: 1, total: 1, completionRate: { $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, avgTime: { $round: ["$avgTime", 1] } }
      }])
    ]);

    res.json({ period, completionTrends, completionTimeByCategory, staffPerformance });
  } catch (error) {
    console.error('Performance fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
};