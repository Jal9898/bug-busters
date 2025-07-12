import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { UserCard } from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/users", currentPage, searchTerm, availabilityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "9",
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (availabilityFilter && availabilityFilter !== "all") {
        params.append("availability", availabilityFilter);
      }
      
      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const handleSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
    // The query will automatically refetch due to the dependency array
  };

  const totalPages = Math.ceil((usersData?.total || 0) / 9);

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
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search skills or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                  <SelectItem value="evenings">Evenings</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSearch}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usersData?.users?.map((user: any) => (
            <UserCard key={user.id} user={user} currentUser={user} />
          ))}
        </div>

        {/* Empty State */}
        {usersData?.users?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchTerm ? "No users found matching your search." : "No users available at the moment."}
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
            
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
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
