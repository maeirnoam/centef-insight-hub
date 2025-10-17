import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const SubmitSource = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    contributorName: '',
    title: '',
    description: '',
    terrorOrganization: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const username = localStorage.getItem('username');

  const terrorOrganizations = [
    'Hamas',
    'Hezbollah',
    'ISIS',
    'Al-Qaeda',
    'Taliban',
    'Boko Haram',
    'Al-Shabaab',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let fileBase64 = '';
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
        file: fileBase64,
        username: username || ''
      });

      toast({
        title: "Success",
        description: "Source submitted successfully"
      });
      navigate('/chat');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit source",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate('/chat')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Submit Source</CardTitle>
            <CardDescription>
              Contribute to CENTEF's research database
            </CardDescription>
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
                <Label htmlFor="file">File Attachment</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Source'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitSource;
