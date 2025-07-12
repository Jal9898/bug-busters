import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Plus, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    location: user?.location || "",
    availability: user?.availability || "weekends",
    isPublic: user?.isPublic ?? true,
  });
  
  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const response = await fetch("/api/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
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
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: async ({ type, skillName }: { type: "offered" | "wanted", skillName: string }) => {
      // First, try to find existing skill or create new one
      let skill = skills?.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
      
      if (!skill) {
        const response = await apiRequest("POST", "/api/skills", { name: skillName });
        skill = await response.json();
      }
      
      // Then add to user's skills
      const endpoint = type === "offered" ? "/api/users/skills-offered" : "/api/users/skills-wanted";
      await apiRequest("POST", endpoint, { skillId: skill.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setNewSkillOffered("");
      setNewSkillWanted("");
      toast({
        title: "Success",
        description: "Skill added successfully",
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
        description: "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async ({ type, skillId }: { type: "offered" | "wanted", skillId: number }) => {
      const endpoint = type === "offered" 
        ? `/api/users/skills-offered/${skillId}` 
        : `/api/users/skills-wanted/${skillId}`;
      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Skill removed successfully",
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
        description: "Failed to remove skill",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await fetch('/api/users/profile-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
      setIsUploadingPhoto(false);
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
        description: "Failed to upload photo",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/users/profile-photo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile photo deleted successfully",
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
        description: "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAddSkill = (type: "offered" | "wanted") => {
    const skillName = type === "offered" ? newSkillOffered : newSkillWanted;
    if (skillName.trim()) {
      addSkillMutation.mutate({ type, skillName: skillName.trim() });
    }
  };

  const handleRemoveSkill = (type: "offered" | "wanted", skillId: number) => {
    removeSkillMutation.mutate({ type, skillId });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploadingPhoto(true);
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleDeletePhoto = () => {
    deletePhotoMutation.mutate();
  };

  // Get the current profile image URL (custom or default)
  const currentProfileImage = user?.customProfileImage || user?.profileImageUrl;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-100">User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Photo Section */}
                <div className="lg:col-span-1">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={currentProfileImage} alt="Profile" />
                      <AvatarFallback className="bg-slate-700 text-slate-100">
                        <User className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-slate-400 mb-2">Profile Photo</p>
                    
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="profile-photo-upload"
                        disabled={isUploadingPhoto || uploadPhotoMutation.isPending}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profile-photo-upload')?.click()}
                        disabled={isUploadingPhoto || uploadPhotoMutation.isPending}
                        className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-100"
                      >
                        {isUploadingPhoto || uploadPhotoMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      
                      {user?.customProfileImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDeletePhoto}
                          disabled={deletePhotoMutation.isPending}
                          className="w-full bg-red-600 border-red-500 hover:bg-red-700 text-white"
                        >
                          {deletePhotoMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Delete Photo
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-2">
                      Supports JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-slate-200">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-slate-200">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-slate-200">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  {/* Availability and Profile Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-200">Availability</Label>
                      <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="weekends">Weekends</SelectItem>
                          <SelectItem value="evenings">Evenings</SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-200">Profile Visibility</Label>
                      <Select value={formData.isPublic ? "public" : "private"} onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills Offered */}
                <div>
                  <Label className="text-slate-200 text-lg">Skills Offered</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {user?.skillsOffered?.map((skill: any) => (
                        <SkillTag
                          key={skill.id}
                          skill={skill}
                          type="offered"
                          onRemove={() => handleRemoveSkill("offered", skill.id)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkillOffered}
                        onChange={(e) => setNewSkillOffered(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        onKeyPress={(e) => e.key === "Enter" && handleAddSkill("offered")}
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddSkill("offered")}
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={!newSkillOffered.trim() || addSkillMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Skills Wanted */}
                <div>
                  <Label className="text-slate-200 text-lg">Skills Wanted</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {user?.skillsWanted?.map((skill: any) => (
                        <SkillTag
                          key={skill.id}
                          skill={skill}
                          type="wanted"
                          onRemove={() => handleRemoveSkill("wanted", skill.id)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkillWanted}
                        onChange={(e) => setNewSkillWanted(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        onKeyPress={(e) => e.key === "Enter" && handleAddSkill("wanted")}
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddSkill("wanted")}
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={!newSkillWanted.trim() || addSkillMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
