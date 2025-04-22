"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, FileText, CheckCircle, Filter, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  participationService,
  ParticipationStatus,
  type ParticipationRecord,
  type VolunteerStatistics,
} from "@/lib/api/participationService"
import { VolunteerHistoryStats } from "@/components/volunteer-history-stats"

export default function VolunteerHistoryPage() {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<ParticipationRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [statistics, setStatistics] = useState<VolunteerStatistics | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selectedRecord, setSelectedRecord] = useState<ParticipationRecord | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  // Fetch history data
  const fetchHistory = async () => {
    if (!isLoaded || !user) return

    setLoading(true)
    try {
      const status = activeTab !== "all" ? (activeTab as ParticipationStatus) : undefined
      const offset = (page - 1) * limit

      const result = await participationService.getMyHistory({
        userId: user.id,
        limit,
        offset,
        status,
        sortBy: "event.startDate",
        sortOrder: "desc",
      })

      setHistory(result.history)
      setTotalCount(result.totalCount)

      // Also fetch statistics
      const stats = await participationService.getVolunteerStatisticsForUser(user.id)
      setStatistics(stats)
    } catch (error) {
      console.error("Error fetching history:", error)
      toast.error("Failed to fetch volunteer history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [isLoaded, user, activeTab, page])

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!selectedRecord) return

    setFeedbackSubmitting(true)
    try {
      await participationService.logFeedback(selectedRecord.eventId, feedbackText)
      toast.success("Feedback submitted successfully")
      setFeedbackDialogOpen(false)
      setFeedbackText("")
      fetchHistory() // Refresh the data
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: ParticipationStatus) => {
    switch (status) {
      case ParticipationStatus.REGISTERED:
        return "secondary"
      case ParticipationStatus.CONFIRMED:
        return "default"
      case ParticipationStatus.ATTENDED:
        return "default"
      case ParticipationStatus.NO_SHOW:
        return "destructive"
      case ParticipationStatus.CANCELLED:
        return "outline"
      default:
        return "secondary"
    }
  }

  // Filter history based on search term
  const filteredHistory = history.filter((record) => {
    if (!searchTerm) return true

    return (
      record.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.event?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / limit)

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">My Volunteer History</h1>
          <p className="text-muted-foreground">Track your volunteer participation and impact</p>
        </div>
        <Button onClick={fetchHistory}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && <VolunteerHistoryStats statistics={statistics} />}

      {/* History Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Participation History</CardTitle>
          <CardDescription>View and manage your volunteer participation records</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.REGISTERED}>Registered</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.CONFIRMED}>Confirmed</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.ATTENDED}>Attended</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.CANCELLED}>Cancelled</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[200px]"
                />
                <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <Separator className="my-4" />
            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No participation records found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? "No records match your search"
                      : activeTab !== "all"
                        ? `You don't have any ${activeTab.toLowerCase()} events`
                        : "You haven't participated in any events yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.event?.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                {record.event?.startDate
                                  ? format(new Date(record.event.startDate), "MMM d, yyyy")
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <Clock className="mr-1 inline-block h-3 w-3" />
                                {record.event?.startTime} - {record.event?.endTime}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                {record.event?.location}
                              </div>
                            </TableCell>
                            <TableCell>{record.role || "Volunteer"}</TableCell>
                            <TableCell>
                              {record.hoursLogged > 0 ? (
                                <div className="flex items-center">
                                  {record.hoursLogged}
                                  {record.hoursVerified && <CheckCircle className="ml-1 h-4 w-4 text-green-500" />}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(record.status as ParticipationStatus)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog
                                  open={feedbackDialogOpen && selectedRecord?.id === record.id}
                                  onOpenChange={(open) => {
                                    setFeedbackDialogOpen(open)
                                    if (!open) setSelectedRecord(null)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRecord(record)
                                        setFeedbackText(record.feedback || "")
                                      }}
                                    >
                                      Feedback
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Event Feedback</DialogTitle>
                                      <DialogDescription>
                                        Share your thoughts about this volunteer experience
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Event</h4>
                                        <p>{selectedRecord?.event?.name}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Your Feedback</h4>
                                        <Textarea
                                          value={feedbackText}
                                          onChange={(e) => setFeedbackText(e.target.value)}
                                          placeholder="Share your experience, what went well, and any suggestions for improvement..."
                                          className="min-h-[150px]"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSubmitFeedback}
                                        disabled={!feedbackText.trim() || feedbackSubmitting}
                                      >
                                        {feedbackSubmitting ? (
                                          <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                          </>
                                        ) : (
                                          "Submit Feedback"
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {record.status === ParticipationStatus.REGISTERED && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await participationService.recordParticipation({
                                          userId: user?.id || "",
                                          eventId: record.eventId,
                                          status: ParticipationStatus.CANCELLED,
                                        })
                                        toast.success("Registration cancelled successfully")
                                        fetchHistory()
                                      } catch (error) {
                                        console.error("Error cancelling registration:", error)
                                        toast.error("Failed to cancel registration")
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {page} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}