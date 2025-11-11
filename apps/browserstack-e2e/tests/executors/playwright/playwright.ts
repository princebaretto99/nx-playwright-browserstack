import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  ExecutorContext,
  getPackageManagerCommand,
  names,
  output,
  workspaceRoot,
} from '@nx/devkit';

export interface PlaywrightExecutorSchema {
  /*
   * if 'projects' is configured then that name needs to be provided instead of
   * all, chromium, firefox, webkit
   **/
  browser?: 'all' | 'chromium' | 'firefox' | 'webkit' | string;
  config?: string;
  debug?: boolean;
  forbidOnly?: boolean;
  fullyParallel?: boolean;
  grep?: string;
  globalTimeout?: number;
  grepInvert?: string;
  headed?: boolean;
  ignoreSnapshots?: boolean;
  workers?: string;
  list?: boolean;
  maxFailures?: number | boolean;
  noDeps?: boolean;
  output?: string;
  passWithNoTests?: boolean;
  project?: string[];
  quiet?: boolean;
  repeatEach?: number;
  reporter?:
    | 'list'
    | 'line'
    | 'dot'
    | 'json'
    | 'junit'
    | 'null'
    | 'github'
    | 'html'
    | 'blob';
  retries?: number;
  shard?: string;
  timeout?: number;
  trace?:
    | 'on'
    | 'off'
    | 'on-first-retry'
    | 'on-all-retries'
    | 'retain-on-failure';
  updateSnapshots?: boolean;
  ui?: boolean;
  uiHost?: string;
  uiPort?: string;
  skipInstall?: boolean;
  browserstackConfig?:string
}

export async function playwrightExecutor(
  options: PlaywrightExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName;
  if (!projectName) {
    throw new Error('Missing projectName in executor context.');
  }
  const projectRoot = context.projectGraph?.nodes?.[projectName]?.data?.root;

  if (!projectRoot) {
    throw new Error(
      `Unable to find the Project Root for ${context.projectName}. Is it set in the project.json?`
    );
  }

  if (!options.skipInstall) {
    output.log({
      title: 'Ensuring Playwright is installed.',
      bodyLines: ['use --skipInstall to skip installation.'],
    });
    const pmc = getPackageManagerCommand();
    execSync(`${pmc.exec} playwright install`, {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
  }

  const args = createArgs(options);
  const p = runPlaywright(args, context.root,options.browserstackConfig);
  if (p.stdout) {
    p.stdout.on('data', (message) => {
      process.stdout.write(message);
    });
  }
  if (p.stderr) {
    p.stderr.on('data', (message) => {
      process.stderr.write(message);
    });
  }

  return new Promise<{ success: boolean }>((resolve) => {
    p.on('close', (code) => {
      resolve({ success: code === 0 });
    });
  });
}

function createArgs(
  opts: PlaywrightExecutorSchema,
  exclude: (keyof PlaywrightExecutorSchema)[] = ['skipInstall','browserstackConfig']
): string[] {
  const args: string[] = [];

  for (const key of Object.keys(opts) as (keyof PlaywrightExecutorSchema)[]) {
    if (exclude.includes(key)) continue;

    const value = opts[key];
    // NOTE: playwright doesn't accept pascalCase args, only kebab-case
    const arg = names(String(key)).fileName;

    if (Array.isArray(value)) {
      args.push(`--${arg}=${value.map((v) => v.trim()).join(',')}`);
    } else if (typeof value === 'boolean') {
      // NOTE: playwright don't accept --arg=false, instead just don't pass the arg.
      if (value) {
        args.push(`--${arg}`);
      }
    } else if (value != null) {
      args.push(`--${arg}=${value}`);
    }
  }

  return args;
}

function runPlaywright(args: string[], cwd: string, browserStackConfig?: string) {
  const env: any = {};
  if (browserStackConfig) {
    env['BROWSERSTACK_CONFIG_FILE'] = browserStackConfig;
  }

  // If a browserStackConfig is provided, try to detect whether the config
  // explicitly disables BrowserStack automation. In that case we should call
  // the Playwright CLI directly (so no SDK wrapper spawns a mock-process that
  // can intercept `launch` calls). This allows using only the CDP connection
  // to BrowserStack without the SDK orchestrating runs.
  try {
    if (browserStackConfig) {
      const configPath = path.resolve(cwd, browserStackConfig);
      if (fs.existsSync(configPath)) {
        const contents = fs.readFileSync(configPath, 'utf8');
        const match = contents.match(/browserstackAutomation\s*:\s*(true|false)/);
        if (match && match[1] === 'false') {
          // Run Playwright directly
          return exec(['npx browserstack-node-sdk playwright test', ...args].join(' '), {
            cwd,
            env: {
              ...process.env,
              ...env,
            },
          });
        }
      }
    }

    // Fallback: run via the BrowserStack SDK wrapper
    return exec(['browserstack-node-sdk playwright test', ...args].join(' '), {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error('Unable to run playwright. Is @playwright/test installed?');
  }
}

export default playwrightExecutor;