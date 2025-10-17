import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/chat');
      return;
    }
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

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
      terror_organization: submission.terror_organization
    });
  };

  const handleReview = async (decision: 'approved' | 'declined') => {
    if (!selectedSubmission) return;
    setIsLoading(true);

    try {
      const response = await fetch('https://n8n.srv974700.hstgr.cloud/webhook-test/bf4dd093-bb02-472c-9454-7ab9af97bd1d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          decision,
          ...editedData,
          username
        })
      });

      if (response.ok) {
        await supabase
          .from('submissions')
          .update({ status: decision, reviewed_at: new Date().toISOString() })
          .eq('id', selectedSubmission.id);

        toast({
          title: "Success",
          description: `Submission ${decision}`
        });
        
        setSelectedSubmission(null);
        loadSubmissions();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to review submission",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate('/chat')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

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
                    selectedSubmission?.id === submission.id ? 'bg-accent' : ''
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
                    onClick={() => handleReview('approved')}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview('declined')}
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
  );
};

export default Review;
