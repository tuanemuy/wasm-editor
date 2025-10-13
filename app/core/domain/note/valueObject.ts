import { v4 as uuidv4 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { NoteErrorCode } from "./errorCode";

// NoteId
export type NoteId = string & { readonly brand: "NoteId" };

export function createNoteId(id: string): NoteId {
  return id as NoteId;
}

export function generateNoteId(): NoteId {
  return uuidv4() as NoteId;
}

// NoteBody
export type NoteBody = string & { readonly brand: "NoteBody" };

export function createNoteBody(body: string): NoteBody {
  // 空文字列も許可（作成直後は空）
  return body as NoteBody;
}

// Timestamp
export type Timestamp = Date & { readonly brand: "Timestamp" };

export function createTimestamp(date: Date): Timestamp {
  return date as Timestamp;
}

export function nowTimestamp(): Timestamp {
  return new Date() as Timestamp;
}

// SortOrder
export const SortOrder = {
  CREATED_ASC: "CREATED_ASC",
  CREATED_DESC: "CREATED_DESC",
  UPDATED_ASC: "UPDATED_ASC",
  UPDATED_DESC: "UPDATED_DESC",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export function createSortOrder(order: string): SortOrder {
  if (!Object.values(SortOrder).includes(order as SortOrder)) {
    throw new BusinessRuleError(
      NoteErrorCode.NoteBodyInvalid,
      "Invalid sort order",
    );
  }
  return order as SortOrder;
}

// SearchQuery
const SEARCH_QUERY_MAX_LENGTH = 500;

export type SearchQuery = string & { readonly brand: "SearchQuery" };

export function createSearchQuery(query: string): SearchQuery {
  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    throw new BusinessRuleError(
      NoteErrorCode.SearchQueryTooLong,
      `Search query exceeds maximum length of ${SEARCH_QUERY_MAX_LENGTH}`,
    );
  }
  return query as SearchQuery;
}

// PaginationParams
export type PaginationParams = {
  offset: number;
  limit: number;
};

export function createPaginationParams(
  offset: number,
  limit: number,
): PaginationParams {
  if (offset < 0) {
    throw new BusinessRuleError(
      NoteErrorCode.InvalidPaginationParams,
      "Offset must be 0 or greater",
    );
  }
  if (limit < 1 || limit > 100) {
    throw new BusinessRuleError(
      NoteErrorCode.InvalidPaginationParams,
      "Limit must be between 1 and 100",
    );
  }
  return { offset, limit };
}
