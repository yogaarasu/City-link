import { Filter } from "bad-words";

const filter = new Filter();

export const cleanProfanity = (value: string) => filter.clean(value || "");
