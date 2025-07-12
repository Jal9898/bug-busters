import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { SwapRequestCard } from "@/components/SwapRequestCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function SwapRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: swapRequests, isLoading } = useQuery({
    queryKey: ["/api/swap-requests"],
    queryFn: async () => {
      const response = await fetch("/api/swap-requests");
      if (!response.ok) throw new Error("Failed to fetch swap requests");
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/swap-requests/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      toast({
        title: "Success",
        description: "Swap request updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update swap request",
        variant: "destructive",
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/swap-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      toast({
        title: "Success",
        description: "Swap request deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete swap request",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    deleteRequestMutation.mutate(id);
  };

  const filteredRequests = swapRequests?.filter((request: any) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSearch = !searchTerm || 
      request.requester.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.offeredSkill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.wantedSkill.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">Swap Requests</h2>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-slate-100">
                <SelectValue placeholder="All Requests" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Swap Requests List */}
        <div className="space-y-4">
          {paginatedRequests.map((request: any) => (
            <SwapRequestCard
              key={request.id}
              request={request}
              currentUser={user}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
              isUpdating={updateStatusMutation.isPending}
              isDeleting={deleteRequestMutation.isPending}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchTerm || statusFilter ? "No swap requests found matching your criteria." : "No swap requests yet."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page 
                    ? "bg-teal-600 hover:bg-teal-700" 
                    : "bg-slate-800 border-slate-600 hover:bg-slate-700"
                  }
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
