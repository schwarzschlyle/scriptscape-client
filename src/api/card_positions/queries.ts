import api from "../client";
import type { CardPosition, CardType } from "./types";

export async function getCardPositions(
  organizationId: string,
  projectId: string,
  cardType?: CardType
): Promise<CardPosition[]> {
  const response = await api.get<CardPosition[]>(
    `/organizations/${organizationId}/projects/${projectId}/card-positions`,
    { params: cardType ? { card_type: cardType } : undefined }
  );
  return response.data;
}

