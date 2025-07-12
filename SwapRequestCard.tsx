import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/StarRating";
import { SkillTag } from "@/components/SkillTag";
import { User, Clock, Check, X, Trash2 } from "lucide-react";

interface SwapRequestCardProps {
  request: any;
  currentUser: any;
  onStatusUpdate: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function SwapRequestCard({
  request,
  currentUser,
  onStatusUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: SwapRequestCardProps) {
  const isRequester = request.requester.id === currentUser?.id;
  const otherUser = isRequester ? request.recipient : request.requester;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "accepted":
        return <Check className="h-4 w-4 mr-1" />;
      case "rejected":
        return <X className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser.profileImageUrl} alt={otherUser.firstName} />
              <AvatarFallback className="bg-slate-700 text-slate-100">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-slate-100 text-lg">
                {otherUser.firstName} {otherUser.lastName}
              </h3>
              <div className="flex items-center space-x-1 mb-2">
                <StarRating rating={4.5} />
                <span className="text-sm text-slate-400">4.5/5</span>
              </div>
              <div className="flex space-x-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    {isRequester ? "You offered" : "They offered"}
                  </p>
                  <SkillTag
                    skill={request.offeredSkill}
                    type="offered"
                    showRemove={false}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    {isRequester ? "You wanted" : "They wanted"}
                  </p>
                  <SkillTag
                    skill={request.wantedSkill}
                    type="wanted"
                    showRemove={false}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(request.status)}>
              {getStatusIcon(request.status)}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
            <div className="mt-4 space-x-2">
              {!isRequester && request.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onStatusUpdate(request.id, "accepted")}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onStatusUpdate(request.id, "rejected")}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              {isRequester && request.status === "pending" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(request.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              {request.status === "accepted" && (
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {request.message && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-300">{request.message}</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Requested {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
