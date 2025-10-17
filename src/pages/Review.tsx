import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

interface Submission {
  id: string;
  contributor_name: string;
  title: string;
  description: string;
  terror_organization: string;
  file_url: string | null;
  status: string;
  created_at: string;
}

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!userId) {
        navigate("/chat");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roleData) {
        navigate("/chat");
        return;
      }

      setIsAdmin(true);
    };

    checkAdminRole();
  }, [userId, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadSubmissions();
    }
  }, [isAdmin]);

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "pending decision")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditedData({
      contributor_name: submission.contributor_name,
      title: submission.title,
      description: submission.description,
      terror_organization: submission.terror_organization,
    });
  };

  const handleReview = async (decision: "approved" | "declined") => {
    if (!selectedSubmission) return;
    setIsLoading(true);

    try {
      await api.reviewSubmission({
        submissionId: selectedSubmission.id,
        decision,
        contributor_name: editedData.contributor_name,
        title: editedData.title,
        description: editedData.description,
        terror_organization: editedData.terror_organization,
        username: username || "",
      });

      await supabase
        .from("submissions")
        .update({ status: decision, reviewed_at: new Date().toISOString() })
        .eq("id", selectedSubmission.id);

      toast({
        title: "Success",
        description: `Submission ${decision}`,
      });

      setSelectedSubmission(null);
      loadSubmissions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to review submission",
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
      </div>

      <div className="flex-1 overflow-auto bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-6xl mx-auto py-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {submissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedSubmission?.id === submission.id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSelectSubmission(submission)}
                  >
                    <h3 className="font-semibold">{submission.title}</h3>
                    <p className="text-sm text-muted-foreground">{submission.contributor_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
                {submissions.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No pending submissions</p>
                )}
              </CardContent>
            </Card>

            {selectedSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contributor Name</label>
                    <Input
                      value={editedData.contributor_name}
                      onChange={(e) => setEditedData({ ...editedData, contributor_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editedData.title}
                      onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editedData.description}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Terror Organization</label>
                    <Input
                      value={editedData.terror_organization}
                      onChange={(e) => setEditedData({ ...editedData, terror_organization: e.target.value })}
                    />
                  </div>

                  {selectedSubmission.file_url && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">File</label>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer">
                          View File
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleReview("approved")}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview("declined")}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
