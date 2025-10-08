export enum ErrorResponseType {
  FailedToLoadArchive = "FailedToLoadArchive",
  FailedToParseComicInfoXml = "FailedToParseComicInfoXml",
  ComicInfoXmlInvalid = "ComicInfoXmlInvalid",
  Other = "Other",
}

export interface ErrorResponse {
  error_type: ErrorResponseType;
  message: string;
}

export const ErrorResponseTypeMap: Record<string, ErrorResponseType> = {
  FailedToLoadArchive: ErrorResponseType.FailedToLoadArchive,
  FailedToParseComicInfoXml: ErrorResponseType.FailedToParseComicInfoXml,
  ComicInfoXmlInvalid: ErrorResponseType.ComicInfoXmlInvalid,
  Other: ErrorResponseType.Other,
};
