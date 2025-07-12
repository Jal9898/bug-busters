import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, MapPin, Clock } from "lucide-react";

interface UserCardProps {
  user: any;
  currentUser: any;
}

export function UserCard({ user, currentUser }: UserCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const sendRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      await apiRequest("POST", "/api/swap-requests", requestData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request sent successfully",
      });
      setIsRequestDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
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
        description: "Failed to send swap request",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = () => {
    // For now, we'll send a basic request
    // In a full implementation, this would open a dialog to select specific skills
    if (user.skillsOffered.length > 0 && currentUser.skillsWanted.length > 0) {
      sendRequestMutation.mutate({
        recipientId: user.id,
        offeredSkillId: currentUser.skillsOffered[0]?.id,
        wantedSkillId: user.skillsOffered[0]?.id,
        message: "I'd like to swap skills with you!",
      });
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-teal-500 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.customProfileImage || user.profileImageUrl} alt={user.firstName} />
              <AvatarFallback className="bg-slate-700 text-slate-100">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-slate-100">
                {user.firstName} {user.lastName}
              </h3>
              {user.location && (
                <p className="text-sm text-slate-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <StarRating rating={user.averageRating || 0} />
            <span className="text-sm text-slate-400">
              {user.averageRating ? `${user.averageRating}/5` : "No ratings"}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400 mb-2">Skills Offered</p>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered?.slice(0, 3).map((skill: any) => (
                <Badge 
                  key={skill.id} 
                  className="bg-teal-600 bg-opacity-20 text-teal-400 border-teal-600"
                >
                  {skill.name}
                </Badge>
              ))}
              {user.skillsOffered?.length > 3 && (
                <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                  +{user.skillsOffered.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-slate-400 mb-2">Skills Wanted</p>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted?.slice(0, 3).map((skill: any) => (
                <Badge 
                  key={skill.id} 
                  variant="secondary" 
                  className="bg-slate-600 text-slate-300"
                >
                  {skill.name}
                </Badge>
              ))}
              {user.skillsWanted?.length > 3 && (
                <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                  +{user.skillsWanted.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
          <div className="flex items-center text-sm text-slate-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>Available {user.availability}</span>
          </div>
          <Button
            onClick={handleSendRequest}
            disabled={sendRequestMutation.isPending || user.id === currentUser?.id}
            className="bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            {sendRequestMutation.isPending ? "Sending..." : "Request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
