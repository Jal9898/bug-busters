import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { User, Settings, Shield, LogOut, Home, MessageSquare, UserCircle, Bell, Send, Menu } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/swap-requests", label: "Requests", icon: Send },
    { path: "/notifications", label: "Notifications", icon: Bell },
    { path: "/profile", label: "Profile", icon: UserCircle },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className="text-xl font-semibold text-slate-100 cursor-pointer">
                Skill Swap Platform
              </h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 px-4 py-2 relative ${
                        isActive 
                          ? "text-teal-400 bg-slate-700 border-b-2 border-teal-400" 
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.path === "/notifications" && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 p-0 flex items-center justify-center">
                          3
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-slate-300 hover:text-slate-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.customProfileImage || user?.profileImageUrl} alt={user?.firstName} />
                    <AvatarFallback className="bg-slate-700 text-slate-100">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-slate-800 border-slate-700" 
                align="end" 
                forceMount
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {user?.isAdmin && (
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {user?.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
                <div className="border-t border-slate-700">
                  <Link href="/profile">
                    <DropdownMenuItem className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem 
                    className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start px-3 py-2 relative ${
                        isActive 
                          ? "text-teal-400 bg-slate-700" 
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{item.label}</span>
                      {item.path === "/notifications" && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 p-0 flex items-center justify-center">
                          3
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
