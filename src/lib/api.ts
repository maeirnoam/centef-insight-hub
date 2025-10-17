const N8N_WEBHOOK_URL = 'https://n8n.srv974700.hstgr.cloud/webhook-test/bf4dd093-bb02-472c-9454-7ab9af97bd1d';

export const api = {
  sendChatMessage: async (message: string, username: string) => {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, username })
    });
    return response.json();
  },

  submitSource: async (formData: {
    contributorName: string;
    title: string;
    description: string;
    terrorOrganization: string;
    filename?: string;
    file?: string;
    username: string;
    userID?: string | null;
  }) => {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return response.json();
  },

  reviewSubmission: async (data: {
    submissionId: string;
    decision: 'approved' | 'declined';
    contributor_name: string;
    title: string;
    description: string;
    terror_organization: string;
    filename?: string;
    drive_url?: string;
    username: string;
  }) => {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
