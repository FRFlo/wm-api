export type JsonPrimitive = string | number | boolean | null | Date | URL;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
