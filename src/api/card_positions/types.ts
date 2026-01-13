export type CardType = "script" | "segmentCollection" | "visualDirection" | "storyboard";

export interface CardPosition {
  id: string;
  projectId: string;
  cardType: CardType;
  cardId: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardPositionUpsert {
  cardType: CardType;
  cardId: string;
  x: number;
  y: number;
}

export interface CardPositionDelete {
  cardType: CardType;
  cardId: string;
}

export interface CardPositionsBatchRequest {
  upserts: CardPositionUpsert[];
  deletes: CardPositionDelete[];
}

