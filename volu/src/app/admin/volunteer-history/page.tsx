"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Calendar, FileText, CheckCircle, AlertCircle, Download, RefreshCw, Search } from "lucide-react"

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
import { participationService, ParticipationStatus, type ParticipationRecord } from "@/lib/api/participationService"

export default function AdminVolunteerHistoryPage() {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<ParticipationRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [selectedRecord, setSelectedRecord] = useState<ParticipationRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [notesSubmitting, setNotesSubmitting] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Fetch history data
  const fetchHistory = async () => {
    if (!isLoaded || !user) return

    setLoading(true)
    try {
      const status = activeTab !== "all" ? (activeTab as ParticipationStatus) : undefined
      const offset = (page - 1) * limit

      const result = await participationService.getAllParticipationHistory({
        limit,
        offset,
        status,
        sortBy: "event.startDate",
        sortOrder: "desc",
      })

      setHistory(result.history)
      setTotalCount(result.totalCount)
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

  // Handle admin notes submission
  const handleSubmitNotes = async () => {
    if (!selectedRecord) return

    setNotesSubmitting(true)
    try {
      await participationService.addAdminNotes(selectedRecord.id, adminNotes)
      toast.success("Admin notes added successfully")
      setNotesDialogOpen(false)
      setAdminNotes("")
      fetchHistory() // Refresh the data
    } catch (error) {
      console.error("Error adding admin notes:", error)
      toast.error("Failed to add admin notes")
    } finally {
      setNotesSubmitting(false)
    }
  }

  // Handle hours verification
  const handleVerifyHours = async (verified: boolean) => {
    if (!selectedRecord) return

    setVerifying(true)
    try {
      await participationService.verifyHours(selectedRecord.id, verified, adminNotes)
      toast.success(`Hours ${verified ? "verified" : "unverified"} successfully`)
      setVerifyDialogOpen(false)
      setAdminNotes("")
      fetchHistory() // Refresh the data
    } catch (error) {
      console.error("Error verifying hours:", error)
      toast.error("Failed to verify hours")
    } finally {
      setVerifying(false)
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
        return null
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
      record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.profile?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-3xl font-bold">Volunteer Participation History</h1>
          <p className="text-muted-foreground">Manage and track volunteer participation across all events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchHistory}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* History Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Participation Records</CardTitle>
          <CardDescription>View and manage volunteer participation records</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.REGISTERED}>Registered</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.CONFIRMED}>Confirmed</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.ATTENDED}>Attended</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.NO_SHOW}>No-Show</TabsTrigger>
                <TabsTrigger value={ParticipationStatus.CANCELLED}>Cancelled</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Input
                  placeholder="Search volunteers or events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[300px]"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    ? `No ${activeTab.toLowerCase()} events found`
                    : "No volunteer participation records available"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Volunteer</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="font-medium">
                              {record.user?.profile?.fullName || record.user?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                          </TableCell>
                          <TableCell>{record.event?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {record.event?.startDate
                                ? format(new Date(record.event.startDate), "MMM d, yyyy")
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{record.role || "Volunteer"}</TableCell>
                          <TableCell>
                            {record.hoursLogged > 0 ? (
                              <div className="flex items-center">
                                {record.hoursLogged}
                                {record.hoursVerified ? (
                                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="ml-1 h-4 w-4 text-yellow-500" />
                                )}
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
                              {/* Buttons & Modals for Actions */}
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
  );
}

