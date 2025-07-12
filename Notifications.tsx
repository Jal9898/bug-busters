import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, MessageSquare, Star, CheckCircle, XCircle } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "swap_request",
      title: "New Swap Request",
      message: "John Doe wants to swap JavaScript for Python",
      time: "2 hours ago",
      read: false,
      avatar: null,
    },
    {
      id: 2,
      type: "request_accepted",
      title: "Request Accepted",
      message: "Your swap request for React has been accepted by Sarah",
      time: "5 hours ago",
      read: false,
      avatar: null,
    },
    {
      id: 3,
      type: "rating_received",
      title: "New Rating",
      message: "You received a 5-star rating from Mike",
      time: "1 day ago",
      read: true,
      avatar: null,
    },
    {
      id: 4,
      type: "platform_message",
      title: "Platform Update",
      message: "New features have been added to the skill swap platform",
      time: "2 days ago",
      read: true,
      avatar: null,
    },
  ]);

  const { data: platformMessages } = useQuery({
    queryKey: ["/api/platform-messages"],
    queryFn: async () => {
      const response = await fetch("/api/platform-messages");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "swap_request":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "request_accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "request_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "rating_received":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "platform_message":
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold text-slate-100">Notifications</h2>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-100"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${
                !notification.read ? 'border-l-4 border-l-teal-500' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {notification.avatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatar} alt="Avatar" />
                        <AvatarFallback className="bg-slate-700 text-slate-100">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.read ? 'text-slate-300' : 'text-slate-100'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-slate-400">{notification.time}</p>
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.read ? 'text-slate-400' : 'text-slate-200'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Messages */}
        {platformMessages && platformMessages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Platform Messages</h3>
            <div className="space-y-4">
              {platformMessages.map((message: any) => (
                <Card key={message.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg text-slate-100">
                        {message.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-slate-300">{message.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No notifications yet</p>
            <p className="text-slate-500 text-sm mt-2">
              You'll see notifications here when users interact with your profile
            </p>
          </div>
        )}
      </main>
    </div>
  );
}