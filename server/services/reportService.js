import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';

/**
 * Report & Analytics Service (Phase 15: Order History and Reports)
 * Provides real database-backed aggregations for:
 * 1. Filtered Order History with multi-criteria search and bill correlation
 * 2. Tenant-scoped Restaurant Reports (Daily, Weekly, Monthly sales, Top items, Payments, Table utilization)
 * 3. Platform-wide Admin Reports (Activity breakdown, Volume, Revenue, Growth trends)
 */

/**
 * Helper to build Date range filters based on query or presets
 */
export const buildDateFilter = (datePreset, startDate, endDate) => {
  const now = new Date();

  if (datePreset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  if (datePreset === 'yesterday') {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  if (datePreset === '7days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  }

  if (datePreset === '30days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  }

  if (startDate || endDate) {
    const range = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      range.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    return range;
  }

  return null;
};

/**
 * 1. ORDER HISTORY
 * Retrieve historical orders strictly scoped to restaurant tenant with rich filters:
 * Search, date ranges, tables, payment status, payment methods, and pagination.
 */
export const getOrderHistory = async (tenantId, query = {}) => {
  const filter = {
    restaurantId: new mongoose.Types.ObjectId(tenantId),
  };

  // Date filtering
  const dateFilter = buildDateFilter(query.datePreset, query.startDate, query.endDate);
  if (dateFilter) {
    filter.createdAt = dateFilter;
  }

  // Table filtering
  if (query.tableId && mongoose.Types.ObjectId.isValid(query.tableId)) {
    filter.tableId = new mongoose.Types.ObjectId(query.tableId);
  }

  // Order Status filtering
  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  // Payment Status filtering
  if (query.paymentStatus && query.paymentStatus !== 'ALL') {
    filter.paymentStatus = query.paymentStatus.toUpperCase();
  }

  // Payment Method filtering (via Bill correlation)
  if (query.paymentMethod && query.paymentMethod !== 'ALL') {
    const matchingBills = await Bill.find({
      restaurantId: filter.restaurantId,
      paymentMethod: query.paymentMethod.toUpperCase(),
    }).select('orderId');

    const matchingOrderIds = matchingBills.map((b) => b.orderId);
    filter._id = { $in: matchingOrderIds };
  }

  // Search keyword filtering
  if (query.search) {
    const cleanSearch = String(query.search).trim();
    if (cleanSearch) {
      filter.$or = [
        { orderNumber: { $regex: cleanSearch, $options: 'i' } },
        { notes: { $regex: cleanSearch, $options: 'i' } },
        { 'items.name': { $regex: cleanSearch, $options: 'i' } },
      ];
    }
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('tableId', 'tableNumber section capacity status')
      .populate('customerId', 'name phone email visitCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  // Fetch associated bills for these orders in a single query
  const orderIds = orders.map((o) => o._id);
  const bills = await Bill.find({
    restaurantId: filter.restaurantId,
    orderId: { $in: orderIds },
  })
    .select('orderId billNumber paymentMethod status paidAt total subtotal tax discount')
    .lean();

  const billMap = {};
  bills.forEach((b) => {
    billMap[String(b.orderId)] = b;
  });

  // Attach bill details to each order
  const populatedOrders = orders.map((o) => ({
    ...o,
    bill: billMap[String(o._id)] || null,
  }));

  // Aggregated summary for the active filter set
  const summaryAgg = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: {
          $sum: {
            $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$total', 0],
          },
        },
        paidCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0],
          },
        },
        cancelledCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summary = summaryAgg.length > 0
    ? {
        totalOrders: summaryAgg[0].totalOrders,
        totalSales: Math.round(summaryAgg[0].totalSales * 100) / 100,
        paidCount: summaryAgg[0].paidCount,
        cancelledCount: summaryAgg[0].cancelledCount,
        aov: summaryAgg[0].totalOrders - summaryAgg[0].cancelledCount > 0
          ? Math.round(
              (summaryAgg[0].totalSales /
                (summaryAgg[0].totalOrders - summaryAgg[0].cancelledCount)) *
                100
            ) / 100
          : 0,
      }
    : {
        totalOrders: 0,
        totalSales: 0,
        paidCount: 0,
        cancelledCount: 0,
        aov: 0,
      };

  return {
    orders: populatedOrders,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary,
  };
};

/**
 * 2. RESTAURANT REPORTS
 * Generates comprehensive analytics calculated from real database orders, bills, and tables:
 * - Daily, Weekly, and Monthly sales trends
 * - Order counts and Average Order Value (AOV)
 * - Top-selling items by volume & revenue
 * - Payment method breakdown (Cash, Card, UPI)
 * - Table utilization matrix
 */
export const getRestaurantReports = async (tenantId, query = {}) => {
  const restaurantObjectId = new mongoose.Types.ObjectId(tenantId);
  const now = new Date();

  // Determine date bounds (default to last 30 days if unspecified)
  let dateFilter = buildDateFilter(query.datePreset || '30days', query.startDate, query.endDate);
  if (!dateFilter) {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = { $gte: thirtyDaysAgo, $lte: now };
  }

  const baseMatch = {
    restaurantId: restaurantObjectId,
    createdAt: dateFilter,
  };

  const validSalesMatch = {
    ...baseMatch,
    status: { $ne: 'CANCELLED' },
  };

  // 1. Overall Sales & Order KPI Aggregation
  const overallAgg = await Order.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$total', 0] },
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] },
        },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] },
        },
      },
    },
  ]);

  const kpis = overallAgg.length > 0
    ? {
        totalOrders: overallAgg[0].totalOrders,
        totalRevenue: Math.round(overallAgg[0].totalRevenue * 100) / 100,
        completedOrders: overallAgg[0].completedOrders,
        cancelledOrders: overallAgg[0].cancelledOrders,
        paidOrders: overallAgg[0].paidOrders,
        aov: overallAgg[0].totalOrders - overallAgg[0].cancelledOrders > 0
          ? Math.round(
              (overallAgg[0].totalRevenue /
                (overallAgg[0].totalOrders - overallAgg[0].cancelledOrders)) *
                100
            ) / 100
          : 0,
      }
    : {
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        aov: 0,
      };

  // 2. Daily Sales Trend
  const dailySalesAgg = await Order.aggregate([
    { $match: validSalesMatch },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailySales = dailySalesAgg.map((d) => ({
    date: d._id,
    revenue: Math.round(d.revenue * 100) / 100,
    orderCount: d.orderCount,
    aov: d.orderCount > 0 ? Math.round((d.revenue / d.orderCount) * 100) / 100 : 0,
  }));

  // 3. Weekly Sales Trend
  const weeklySalesAgg = await Order.aggregate([
    { $match: validSalesMatch },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  const weeklySales = weeklySalesAgg.map((w) => ({
    weekLabel: `W${w._id.week}, ${w._id.year}`,
    revenue: Math.round(w.revenue * 100) / 100,
    orderCount: w.orderCount,
    aov: w.orderCount > 0 ? Math.round((w.revenue / w.orderCount) * 100) / 100 : 0,
  }));

  // 4. Monthly Sales Trend
  const monthlySalesAgg = await Order.aggregate([
    { $match: validSalesMatch },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlySales = monthlySalesAgg.map((m) => ({
    monthLabel: m._id,
    revenue: Math.round(m.revenue * 100) / 100,
    orderCount: m.orderCount,
    aov: m.orderCount > 0 ? Math.round((m.revenue / m.orderCount) * 100) / 100 : 0,
  }));

  // 5. Top-Selling Menu Items
  const topItemsAgg = await Order.aggregate([
    { $match: validSalesMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderOccurrences: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  const topSellingItems = topItemsAgg.map((item) => ({
    name: item._id,
    quantitySold: item.totalQuantity,
    totalRevenue: Math.round(item.totalRevenue * 100) / 100,
    averagePrice: item.totalQuantity > 0 ? Math.round((item.totalRevenue / item.totalQuantity) * 100) / 100 : 0,
    orderOccurrences: item.orderOccurrences,
  }));

  // 6. Payment Method Breakdown (from settled Bills & Payments)
  const paymentBreakdownAgg = await Bill.aggregate([
    {
      $match: {
        restaurantId: restaurantObjectId,
        status: 'PAID',
        createdAt: dateFilter,
      },
    },
    {
      $group: {
        _id: { $ifNull: ['$paymentMethod', 'UNSPECIFIED'] },
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const totalPaymentAmount = paymentBreakdownAgg.reduce((sum, p) => sum + p.totalAmount, 0);

  const paymentBreakdown = paymentBreakdownAgg.map((p) => ({
    method: p._id,
    count: p.count,
    totalAmount: Math.round(p.totalAmount * 100) / 100,
    percentage: totalPaymentAmount > 0
      ? Math.round((p.totalAmount / totalPaymentAmount) * 1000) / 10
      : 0,
  }));

  // 7. Table Utilization & Revenue Contribution
  const tableUtilizationAgg = await Order.aggregate([
    { $match: validSalesMatch },
    {
      $group: {
        _id: '$tableId',
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
      },
    },
    { $sort: { orderCount: -1 } },
  ]);

  // Lookup table names
  const allRestaurantTables = await Table.find({ restaurantId: restaurantObjectId })
    .select('tableNumber section capacity')
    .lean();

  const tableMetaMap = {};
  allRestaurantTables.forEach((t) => {
    tableMetaMap[String(t._id)] = t;
  });

  const tableUtilization = tableUtilizationAgg.map((item) => {
    const meta = tableMetaMap[String(item._id)] || {};
    return {
      tableId: item._id,
      tableNumber: meta.tableNumber || 'Unknown',
      section: meta.section || 'General',
      capacity: meta.capacity || 0,
      orderCount: item.orderCount,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100,
      aov: item.orderCount > 0 ? Math.round((item.totalRevenue / item.orderCount) * 100) / 100 : 0,
    };
  });

  return {
    kpis,
    dailySales,
    weeklySales,
    monthlySales,
    topSellingItems,
    paymentBreakdown,
    tableUtilization,
    period: {
      preset: query.datePreset || '30days',
      from: dateFilter.$gte,
      to: dateFilter.$lte,
    },
  };
};

/**
 * 3. PLATFORM REPORTS
 * Real database platform-wide analytics for PLATFORM_ADMIN:
 * - Restaurant statuses (Total, Active, Suspended, Pending)
 * - Platform total orders and gross settled revenue
 * - Restaurant activity breakdown (orders, volume, revenue per tenant)
 * - Platform daily sales trend across all tenants
 */
export const getPlatformReports = async () => {
  const [
    totalRestaurants,
    activeRestaurants,
    suspendedRestaurants,
    pendingRestaurants,
    totalOrders,
    completedOrders,
    revenueAgg,
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ status: 'ACTIVE' }),
    Restaurant.countDocuments({ status: 'SUSPENDED' }),
    Restaurant.countDocuments({ status: 'PENDING' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'COMPLETED' }),
    Bill.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
  ]);

  const platformRevenue = revenueAgg.length > 0
    ? Math.round(revenueAgg[0].totalRevenue * 100) / 100
    : 0;

  // Restaurant Activity Roster (Orders count & Revenue per tenant)
  const activityAgg = await Order.aggregate([
    {
      $group: {
        _id: '$restaurantId',
        orderCount: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$total', 0] },
        },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  // Lookup restaurant metadata
  const restaurants = await Restaurant.find()
    .select('name city state status createdAt')
    .lean();

  const restMap = {};
  restaurants.forEach((r) => {
    restMap[String(r._id)] = r;
  });

  const restaurantActivity = restaurants.map((r) => {
    const act = activityAgg.find((a) => String(a._id) === String(r._id)) || {
      orderCount: 0,
      totalRevenue: 0,
      lastOrderDate: null,
    };

    return {
      restaurantId: r._id,
      name: r.name,
      city: r.city,
      state: r.state,
      status: r.status,
      orderCount: act.orderCount,
      totalRevenue: Math.round(act.totalRevenue * 100) / 100,
      lastOrderDate: act.lastOrderDate,
      joinedAt: r.createdAt,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Platform Daily Sales Trend (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const platformDailyTrendAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: fourteenDaysAgo },
        status: { $ne: 'CANCELLED' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const platformDailyTrend = platformDailyTrendAgg.map((d) => ({
    date: d._id,
    revenue: Math.round(d.revenue * 100) / 100,
    orders: d.orders,
  }));

  return {
    kpis: {
      totalRestaurants,
      activeRestaurants,
      suspendedRestaurants,
      pendingRestaurants,
      totalOrders,
      completedOrders,
      totalRevenue: platformRevenue,
      averageRevenuePerActiveRestaurant: activeRestaurants > 0
        ? Math.round((platformRevenue / activeRestaurants) * 100) / 100
        : 0,
    },
    restaurantActivity,
    platformDailyTrend,
  };
};
