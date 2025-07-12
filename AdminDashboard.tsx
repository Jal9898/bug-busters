import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, MessageSquare, Shield, AlertTriangle, User } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [messageForm, setMessageForm] = useState({
    title: "",
    content: "",
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      window.location.href = "/";
    }
  }, [user]);

  const { data: adminUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch admin users");
      return response.json();
    },
    enabled: user?.isAdmin,
  });

  const { data: adminSwapRequests } = useQuery({
    queryKey: ["/api/admin/swap-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/swap-requests");
      if (!response.ok) throw new Error("Failed to fetch admin swap requests");
      return response.json();
    },
    enabled: user?.isAdmin,
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest("POST", "/api/admin/ban-user", { userId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User has been banned successfully",
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
        description: "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      await apiRequest("POST", "/api/admin/platform-message", data);
    },
    onSuccess: () => {
      setMessageForm({ title: "", content: "" });
      toast({
        title: "Success",
        description: "Platform message sent successfully",
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleBanUser = (userId: string, reason: string) => {
    banUserMutation.mutate({ userId, reason });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageForm.title.trim() && messageForm.content.trim()) {
      sendMessageMutation.mutate(messageForm);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Access Denied</h2>
              <p className="text-slate-400">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = adminUsers?.length || 0;
  const activeSwaps = adminSwapRequests?.filter((req: any) => req.status === "accepted")?.length || 0;
  const pendingReviews = adminSwapRequests?.filter((req: any) => req.status === "pending")?.length || 0;
  const publicUsers = adminUsers?.filter((user: any) => user.isPublic)?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Admin Dashboard</h2>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-teal-500" />
                  <div>
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-slate-100">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-400">Active Swaps</p>
                    <p className="text-2xl font-bold text-slate-100">{activeSwaps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-slate-400">Pending Reviews</p>
                    <p className="text-2xl font-bold text-slate-100">{pendingReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-400">Public Users</p>
                    <p className="text-2xl font-bold text-slate-100">{publicUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {adminUsers?.slice(0, 10).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                        <AvatarFallback className="bg-slate-600 text-slate-100">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-slate-100 font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.isPublic ? "default" : "secondary"}>
                            {user.isPublic ? "Public" : "Private"}
                          </Badge>
                          {user.isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!user.isAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBanUser(user.id, "Banned by admin")}
                          disabled={banUserMutation.isPending}
                        >
                          {user.isPublic ? "Ban" : "Unban"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Messages */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Send Platform Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-200">Message Title</Label>
                  <Input
                    id="title"
                    value={messageForm.title}
                    onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                    placeholder="e.g., Platform Update"
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content" className="text-slate-200">Message Content</Label>
                  <Textarea
                    id="content"
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    placeholder="Enter your message..."
                    rows={4}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Swap Requests */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Swap Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {adminSwapRequests?.slice(0, 10).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-slate-100 font-medium">
                        Swap Request #{request.id}
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      request.status === "pending" ? "secondary" :
                      request.status === "accepted" ? "default" :
                      request.status === "rejected" ? "destructive" : "outline"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
