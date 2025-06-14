"use client"

import { useState } from "react"
import { Clock, Calendar, Award, CheckCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParticipationStatus, VolunteerStatistics } from "@/lib/api/participationService"

interface VolunteerHistoryStatsProps {
  statistics: VolunteerStatistics
}

export const VolunteerHistoryStats: React.FC<VolunteerHistoryStatsProps> = ({ statistics }) => {
  const [chartView, setChartView] = useState<"events" | "hours">("events")

  const chartData = Object.entries(
    chartView === "events" ? statistics.eventsByMonth || {} : statistics.hoursByMonth || {}
  ).map(([month, value]) => ({
    month,
    value,
  }))

  chartData.sort((a, b) => {
    const [aMonth, aYear] = a.month.split(" ")
    const [bMonth, bYear] = b.month.split(" ")

    if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.indexOf(aMonth) - months.indexOf(bMonth)
  })

  const maxValue = Math.max(...chartData.map((d) => d.value), 1)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
      {/* Total Hours */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Hours of volunteer service</p>
        </CardContent>
      </Card>

      {/* Events Attended */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.statusCounts?.[ParticipationStatus.ATTENDED] ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">Completed volunteer events</p>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(statistics.statusCounts?.[ParticipationStatus.REGISTERED] ?? 0) +
              (statistics.statusCounts?.[ParticipationStatus.CONFIRMED] ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground">Registered for future events</p>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculateCompletionRate(statistics)}%</div>
          <p className="text-xs text-muted-foreground">Events attended vs. registered</p>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Volunteer Activity</CardTitle>
            <Tabs value={chartView} onValueChange={(val) => setChartView(val as "events" | "hours")}>
              <TabsList>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Your volunteer activity over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {chartData.length > 0 ? (
              <div className="flex h-full items-end gap-2">
                {chartData.map((data) => (
                  <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(data.value / maxValue) * 150}px` }}
                    />
                    <div className="text-xs text-muted-foreground">{data.month}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Completion rate helper
function calculateCompletionRate(statistics: VolunteerStatistics): string {
  const attended = statistics.statusCounts?.[ParticipationStatus.ATTENDED] ?? 0
  const total =
    attended +
    (statistics.statusCounts?.[ParticipationStatus.NO_SHOW] ?? 0) +
    (statistics.statusCounts?.[ParticipationStatus.CANCELLED] ?? 0)

  return total === 0 ? "100" : ((attended / total) * 100).toFixed(0)
}
