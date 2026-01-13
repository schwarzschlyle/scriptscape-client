import api from "../client";
import type { CardPosition, CardPositionsBatchRequest } from "./types";

export async function batchWriteCardPositions(
  organizationId: string,
  projectId: string,
  body: CardPositionsBatchRequest
): Promise<CardPosition[]> {
  const response = await api.post<CardPosition[]>(
    `/organizations/${organizationId}/projects/${projectId}/card-positions/batch`,
    body
  );
  return response.data;
}

