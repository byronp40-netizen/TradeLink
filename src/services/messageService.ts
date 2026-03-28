import { apiRequest } from "../lib/api";

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  read: boolean | null;
  created_at: string | null;
};

export async function getMessagesByJobId(
  jobId: string,
  userId: string
): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/api/messages?job_id=${encodeURIComponent(jobId)}&user_id=${encodeURIComponent(userId)}`
  );
}

export async function sendMessage(input: {
  job_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
}): Promise<Message> {
  return apiRequest<Message>("/api/messages", {
    method: "POST",
    body: input,
  });
}
