import {parseArgs} from "util";
export function getArgs() {
  const {values} = parseArgs({
    args: Bun.argv,
    options: {
      in: {
        type: "string",
        short: "i",
      },
      out: {
        type: "string",
        short: "o",
      },
      start: {
        type: "string",
        default: "0",
        short: "s",
      },
      end: {
        type: "string",
        default: "10000",
        short: "e",
      },
    },
    strict: true,
    allowPositionals: true,
  });
  return values;
}

export function paprikaArgs() {
  const {values} = parseArgs({
    args: Bun.argv,
    options: {
      in: {
        type: "string",
        short: "i",
      },
      start: {
        type: "string",
        default: "0",
        short: "s",
      },
      end: {
        type: "string",
        default: "10000",
        short: "e",
      },
    },
    strict: true,
    allowPositionals: true,
  });
  return values;
}
