import AbortController from "node-abort-controller";
import fetch, { Response } from "node-fetch";

import Configuration from "./configuration";
import Utilities from "./utilities";

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

export class Osmosis {
  private sql: string | undefined;
  private sql_path: string | undefined;
  private extra_config_path: string;

  constructor(sql: string | undefined, sql_path: string | undefined, extra_config_path: string) {
    this.sql = sql;
    this.sql_path = sql_path;
    this.extra_config_path = extra_config_path;
  }

  public getURL(): string {
    let url = `http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()}/lint?sql_path=${this.sql_path}`;
    if (this.sql !== undefined) {
      url = `http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()}/lint?`;
    }

    if (this.extra_config_path) {
      url += `&extra_config_path=${this.extra_config_path}`;
    }

    return url;
  }

  public async lint<T>(timeout = 25000) {
    const failedToReachServerError: OsmosisErrorContainer = {
      error: {
        code: OsmosisErrorCode.FailedToReachServer,
        message: "Query failed to reach dbt sync server.",
        data: {
          "error": `Is the server listening on the http://${Configuration.osmosisHost()}:${Configuration.osmosisPort()} address?`,
        },
      }
    };

    const abortController = new AbortController();
    const timeoutHandler = setTimeout(() => {
      abortController.abort();
    }, timeout);
    let response: Response;

    try {
      response = await fetch(
        encodeURI(this.getURL()),
        {
          method: "POST",
          signal: abortController.signal,
          body: this.sql
        }
      );
    } catch (error) {
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine("Raw dbt-omsosis /lint error response:");
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine(error as string);
      Utilities.appendHyphenatedLine();

      clearTimeout(timeoutHandler);
      return failedToReachServerError;
    }
    clearTimeout(timeoutHandler);
    return await response.json() as T;
  }
}

