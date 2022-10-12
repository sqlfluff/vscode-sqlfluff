import fetch from "node-fetch";

import { Configuration } from "./configuration";

export interface OsmosisRunResult {
  column_names: string[],
  rows: any[][],
  raw_sql: string,
  compiled_sql: string,
}

export interface OsmosisCompileResult {
  result: string;
}

export interface OsmosisResetResult {
  result: string;
}

export enum OsmosisFullReparse {
  True = "true",
  False = "false"
}

export enum OsmosisErrorCode {
  FailedToReachServer = -1,
  CompileSqlFailure = 1,
  ExecuteSqlFailure = 2,
  ProjectParseFailure = 3,
}

export interface OsmosisErrorContainer {
  error: {
    code: OsmosisErrorCode,
    message: string,
    data: { [index: string]: (string | number); },
  };
}

const failedToReachServerError: OsmosisErrorContainer = {
  error: {
    code: OsmosisErrorCode.FailedToReachServer,
    message: "Query failed to reach dbt sync server",
    data: {
      // "error": `Is the server listening on http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()} address?`,
      "error": "Is the server listening?",
    },
  }
};

export class Osmosis {
  static async lint<T>(sql: string | undefined, sql_path: string, extra_config_path: string, ignoreLocalConfig: boolean, timeout = 25000) {
    const abortController = new AbortController();
    const timeoutHandler = setTimeout(() => {
      abortController.abort();
    }, timeout);
    let response;
    // const axios = require("axios").default; // eslint-disable-line @typescript-eslint/no-var-requires

    let url = `http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()}/lint?sql_path=${sql_path}`;
    // TODO: Passing in the sql currently does not work very well.
    if (sql !== undefined) {
      url = `http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()}/lint?sql=${sql}&extra_config_path=${extra_config_path}`;
    }

    if (extra_config_path) {
      url += `&extra_config_path=${extra_config_path}`;
    }
    // TODO: Far as I can tell this is not implemented yet.
    if (ignoreLocalConfig) {
      url += `&ignore_local_config=${ignoreLocalConfig}`;
    }

    const data = {
      sql,
      extra_config_path,
      ignoreLocalConfig,
      signal: abortController.signal
    };
    try {
      response = await fetch(
        url,
        {
          method: "POST",
          ...data,
          signal: abortController.signal
        }
      );
    } catch (e) {
      clearTimeout(timeoutHandler);
      return failedToReachServerError;
    }
    clearTimeout(timeoutHandler);
    return await response.json() as T;
  }
}

