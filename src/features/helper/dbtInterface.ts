import AbortController from "node-abort-controller";
import fetch, { RequestInit, Response } from "node-fetch";

import Configuration from "./configuration";
import Utilities from "./utilities";

export interface DbtInterfaceRunResult {
  column_names: string[],
  rows: any[][],
  raw_sql: string,
  compiled_sql: string,
}

export interface DbtInterfaceCompileResult {
  result: string;
}

export interface DbtInterfaceResetResult {
  result: string;
}

export enum DbtInterfaceFullReparse {
  True = "true",
  False = "false"
}

export enum DbtInterfaceErrorCode {
  FailedToReachServer = -1,
  CompileSqlFailure = 1,
  ExecuteSqlFailure = 2,
  ProjectParseFailure = 3,
}

export interface DbtInterfaceErrorContainer {
  error: {
    code: DbtInterfaceErrorCode,
    message: string,
    data: { [index: string]: (string | number); },
  };
}

export class DbtInterface {
  private sql: string | undefined;
  private sql_path: string | undefined;
  private extra_config_path: string;

  constructor(sql: string | undefined, sql_path: string | undefined, extra_config_path: string) {
    this.sql = sql;
    this.sql_path = sql_path;
    this.extra_config_path = extra_config_path;
  }

  public getLintURL(): string {
    let url = `http://${Configuration.dbtInterfaceHost()}:${Configuration.dbtInterfacePort()}/lint?sql_path=${this.sql_path}`;
    if (this.sql !== undefined) {
      url = `http://${Configuration.dbtInterfaceHost()}:${Configuration.dbtInterfacePort()}/lint?`;
    }

    if (this.extra_config_path) {
      url += `&extra_config_path=${this.extra_config_path}`;
    }

    return url;
  }

  public async healthCheck(): Promise<boolean> {
    const abortController = new AbortController();
    const timeoutHandler = setTimeout(() => {
        abortController.abort();
    }, 1000);
    try {
        const response = await fetch(
            `http://${Configuration.dbtInterfaceHost()}:${Configuration.dbtInterfacePort()}/health`, // Replaces project-required healthcheck
            {
                method: "GET",
                signal: abortController.signal,
            }
        );
        if (response.status === 200) {
            return true;
        } else {
          return false;
        }
    } catch (e) {
        return false;
    } finally {
        clearTimeout(timeoutHandler);
    }
  }

  

  public async lint<T>(timeout = 25000) {
    const failedToReachServerError: DbtInterfaceErrorContainer = {
      error: {
        code: DbtInterfaceErrorCode.FailedToReachServer,
        message: "Query failed to reach dbt sync server.",
        data: {
          "error": `Is the server listening on the http://${Configuration.dbtInterfaceHost()}:${Configuration.dbtInterfacePort()} address?`,
        },
      }
    };
    const datacovesPowerUserError: DbtInterfaceErrorContainer = {
      error: {
        code: DbtInterfaceErrorCode.FailedToReachServer,
        message: "Dbt project not registered in Datacoves Power User extension. ",
        data: {
          "error": "Wait for it's loading process to finish",
        }
      }
    }
    // Wait until `health` endpoint is available before calling `/lint
    const healthy = await this.healthCheck();
    if (!healthy) {
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine("Unhealthy dbt project:");
      Utilities.appendHyphenatedLine();
      return datacovesPowerUserError;
    }
    
    const abortController = new AbortController();
    const timeoutHandler = setTimeout(() => {
      abortController.abort();
    }, timeout);
    let response: Response;

    try {
      /*
      Before reaching backend's `lint` endpoint, we need to call `/health` to ensure a Project has been registered in the backend
      */
      
      response = await fetch(
        encodeURI(this.getLintURL()),
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

