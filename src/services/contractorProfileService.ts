import { apiRequest } from "../lib/api";
import type { ContractorProfile } from "../types";

export async function getContractorProfileById(
  id: string
): Promise<ContractorProfile> {
  return apiRequest<ContractorProfile>(`/api/contractor-profiles/${id}`);
}

export async function updateContractorProfile(
  id: string,
  updates: Partial<ContractorProfile>
): Promise<ContractorProfile> {
  return apiRequest<ContractorProfile>(`/api/contractor-profiles/${id}`, {
    method: "PATCH",
    body: updates,
  });
}