import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const SubmitSource = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    contributorName: "",
    title: "",
    description: "",
    terrorOrganization: "",
    filename: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!userId) return;

       const { data: roleData, error } = await supabase
         .from("users")
         .select("role")
         .eq("id", userId)
         .maybeSingle();
 
       if (!error && roleData?.role === "admin") {
         setIsAdmin(true);
       }
    };

    checkAdminRole();
  }, [userId]);
  const terrorOrganizations = [
    "Hamas",
    "Hezbollah",
    "ISIS",
    "Al-Qaeda",
    "Taliban",
    "Boko Haram",
    "Al-Shabaab",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let fileBase64 = "";
      if (file) {
        const reader = new FileReader();
        fileBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      await api.submitSource({
        contributorName: formData.contributorName,
        title: formData.title,
        description: formData.description,
        terrorOrganization: formData.terrorOrganization,
        filename: formData.filename,
        file: fileBase64,
        username: username || "",
        userID: userId,
      });

      toast({
        title: "Success",
        description: "Source submitted successfully",
      });
      navigate("/chat");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit source",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-bold text-primary">CENTEF Research Assistant</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        {
          <Tabs value={location.pathname} className="px-6">
            <TabsList>
              <TabsTrigger value="/chat" onClick={() => navigate("/chat")}>
                Chat
              </TabsTrigger>
              <TabsTrigger value="/submit" onClick={() => navigate("/submit")}>
                Submit Source
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="/review" onClick={() => navigate("/review")}>
                  Review Submissions
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        }
      </div>

      <div className="flex-1 overflow-auto bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Submit Source</CardTitle>
              <CardDescription>Contribute to CENTEF's research database</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contributorName">Contributor Name</Label>
                  <Input
                    id="contributorName"
                    value={formData.contributorName}
                    onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What is this contribution? What is the main takeaway from this source?"
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrorOrganization">Terror Organization</Label>
                  <Select
                    value={formData.terrorOrganization}
                    onValueChange={(value) => setFormData({ ...formData, terrorOrganization: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {terrorOrganizations.map((org) => (
                        <SelectItem key={org} value={org}>
                          {org}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={formData.filename}
                    onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File Attachment</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt,.jpeg,.jpg,.xlsx,.xls,.pptx,.png,.csv,.mp4"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Source"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmitSource;
