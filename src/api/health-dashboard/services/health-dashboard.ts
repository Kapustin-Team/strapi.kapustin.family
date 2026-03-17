interface DateRange {
  from: string;
  to: string;
}

interface DashboardOptions {
  dateRange: DateRange;
  include?: string[];
}

const ALL_SECTIONS = [
  'body',
  'whoop_cycles',
  'whoop_recovery',
  'whoop_sleep',
  'workouts',
  'nutrition',
  'meals',
  'water',
  'supplements',
];

export default () => ({
  async getDashboard({ dateRange, include }: DashboardOptions) {
    const sections = include?.length ? include : ALL_SECTIONS;
    const { from, to } = dateRange;

    const dateFilter = {
      $gte: from,
      $lte: to,
    };

    const datetimeFilter = {
      $gte: `${from}T00:00:00.000Z`,
      $lte: `${to}T23:59:59.999Z`,
    };

    const result: Record<string, any> = {
      dateRange: { from, to },
      sections: {},
    };

    // Body metrics
    if (sections.includes('body')) {
      result.sections.body = await strapi.documents('api::body-metric.body-metric').findMany({
        filters: { measuredAt: datetimeFilter },
        sort: 'measuredAt:asc',
      });
    }

    // WHOOP Cycles (strain)
    if (sections.includes('whoop_cycles')) {
      result.sections.whoopCycles = await strapi.documents('api::whoop-cycle.whoop-cycle').findMany({
        filters: { cycleDate: dateFilter },
        sort: 'cycleDate:asc',
      });
    }

    // WHOOP Recovery
    if (sections.includes('whoop_recovery')) {
      result.sections.whoopRecovery = await strapi.documents('api::whoop-recovery.whoop-recovery').findMany({
        filters: { recoveryDate: dateFilter },
        sort: 'recoveryDate:asc',
      });
    }

    // WHOOP Sleep
    if (sections.includes('whoop_sleep')) {
      result.sections.whoopSleep = await strapi.documents('api::whoop-sleep.whoop-sleep').findMany({
        filters: { sleepDate: dateFilter },
        sort: 'sleepDate:asc',
      });
    }

    // Workouts with sets and exercises
    if (sections.includes('workouts')) {
      result.sections.workouts = await strapi.documents('api::workout.workout').findMany({
        filters: { startedAt: datetimeFilter },
        sort: 'startedAt:asc',
        populate: {
          sets: {
            populate: {
              exercise: true,
            },
            sort: 'setOrder:asc',
          },
          whoopCycle: true,
        },
      });
    }

    // Daily nutrition summaries
    if (sections.includes('nutrition')) {
      result.sections.nutrition = await strapi.documents('api::daily-nutrition.daily-nutrition').findMany({
        filters: { date: dateFilter },
        sort: 'date:asc',
      });
    }

    // Individual meals
    if (sections.includes('meals')) {
      result.sections.meals = await strapi.documents('api::meal.meal').findMany({
        filters: { eatenAt: datetimeFilter },
        sort: 'eatenAt:asc',
        populate: {
          items: true,
          photo: true,
        },
      });
    }

    // Water intake
    if (sections.includes('water')) {
      result.sections.water = await strapi.documents('api::water-log.water-log').findMany({
        filters: { drankAt: datetimeFilter },
        sort: 'drankAt:asc',
      });
    }

    // Supplements
    if (sections.includes('supplements')) {
      result.sections.supplements = await strapi.documents('api::supplement-log.supplement-log').findMany({
        filters: { takenAt: datetimeFilter },
        sort: 'takenAt:asc',
      });
    }

    return result;
  },

  async getSummary({ dateRange }: DashboardOptions) {
    const dashboard = await this.getDashboard({ dateRange });
    const s = dashboard.sections;

    // Calculate averages and aggregates
    const summary: Record<string, any> = {
      dateRange: dashboard.dateRange,
      daysCount: 0,
    };

    // Body
    if (s.body?.length) {
      const latest = s.body[s.body.length - 1];
      const earliest = s.body[0];
      summary.body = {
        latestWeight: latest.weight,
        weightChange: latest.weight && earliest.weight
          ? +(latest.weight - earliest.weight).toFixed(1)
          : null,
        latestBodyFat: latest.bodyFatPercent,
        measurements: s.body.length,
      };
    }

    // WHOOP Recovery
    if (s.whoopRecovery?.length) {
      const scores = s.whoopRecovery.map((r: any) => r.recoveryScore).filter(Boolean);
      const hrvs = s.whoopRecovery.map((r: any) => r.hrvRmssd).filter(Boolean);
      const rhrs = s.whoopRecovery.map((r: any) => r.restingHeartRate).filter(Boolean);
      summary.recovery = {
        avgScore: +(scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1),
        avgHrv: +(hrvs.reduce((a: number, b: number) => a + b, 0) / hrvs.length).toFixed(1),
        avgRestingHr: +(rhrs.reduce((a: number, b: number) => a + b, 0) / rhrs.length).toFixed(0),
        greenDays: s.whoopRecovery.filter((r: any) => r.recoveryZone === 'green').length,
        yellowDays: s.whoopRecovery.filter((r: any) => r.recoveryZone === 'yellow').length,
        redDays: s.whoopRecovery.filter((r: any) => r.recoveryZone === 'red').length,
        days: scores.length,
      };
    }

    // WHOOP Sleep
    if (s.whoopSleep?.length) {
      const sleepHours = s.whoopSleep.map((sl: any) => sl.totalSleepHours).filter(Boolean);
      const scores = s.whoopSleep.map((sl: any) => sl.sleepScore).filter(Boolean);
      summary.sleep = {
        avgHours: +(sleepHours.reduce((a: number, b: number) => a + b, 0) / sleepHours.length).toFixed(1),
        avgScore: scores.length ? +(scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : null,
        days: sleepHours.length,
      };
    }

    // WHOOP Strain
    if (s.whoopCycles?.length) {
      const strains = s.whoopCycles.map((c: any) => c.strain).filter(Boolean);
      const cals = s.whoopCycles.map((c: any) => c.calories).filter(Boolean);
      summary.strain = {
        avgStrain: +(strains.reduce((a: number, b: number) => a + b, 0) / strains.length).toFixed(1),
        avgCalories: cals.length ? Math.round(cals.reduce((a: number, b: number) => a + b, 0) / cals.length) : null,
        days: strains.length,
      };
    }

    // Workouts
    if (s.workouts?.length) {
      summary.workouts = {
        totalSessions: s.workouts.length,
        totalMinutes: s.workouts.reduce((a: number, w: any) => a + (w.durationMinutes || 0), 0),
        byType: s.workouts.reduce((acc: any, w: any) => {
          acc[w.workoutType] = (acc[w.workoutType] || 0) + 1;
          return acc;
        }, {}),
      };
    }

    // Nutrition
    if (s.nutrition?.length) {
      const cals = s.nutrition.map((n: any) => n.totalCalories).filter(Boolean);
      const protein = s.nutrition.map((n: any) => n.totalProteinG).filter(Boolean);
      summary.nutrition = {
        avgCalories: cals.length ? Math.round(cals.reduce((a: number, b: number) => a + b, 0) / cals.length) : null,
        avgProtein: protein.length ? +(protein.reduce((a: number, b: number) => a + b, 0) / protein.length).toFixed(0) : null,
        trackedDays: s.nutrition.length,
        cheatDays: s.nutrition.filter((n: any) => n.isCheatDay).length,
      };
    }

    // Water
    if (s.water?.length) {
      const totalMl = s.water.reduce((a: number, w: any) => a + (w.amountMl || 0), 0);
      const days = new Set(s.water.map((w: any) => w.drankAt?.substring(0, 10))).size;
      summary.water = {
        avgDailyMl: days ? Math.round(totalMl / days) : null,
        trackedDays: days,
      };
    }

    return summary;
  },
});
