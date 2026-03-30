import { spawn } from "child_process";
import { access, mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EXECUTION_TIMEOUT_MS = 8000;

type RunRequestBody = {
  language?: string;
  source?: string;
  stdin?: string;
};

type ProcessResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
};

function createPythonSource(source: string) {
  if (/if\s+__name__\s*==\s*["']__main__["']/.test(source)) {
    return source;
  }

  return `${source}

if __name__ == "__main__":
    import sys

    _stdin = sys.stdin.read()
    _runner = globals().get("solve") or globals().get("main") or globals().get("solution")
    if callable(_runner):
        _result = _runner(_stdin)
        if _result is not None:
            print(_result)
`;
}

async function commandExists(command: string) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter);

  for (const entry of pathEntries) {
    if (!entry) continue;
    try {
      await access(path.join(entry, command));
      return true;
    } catch {
      // keep checking
    }
  }

  return false;
}

function runProcess(options: {
  command: string;
  args: string[];
  stdin?: string;
  cwd?: string;
}) {
  return new Promise<ProcessResult>((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      stdio: "pipe",
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({
        code,
        signal,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
        timedOut,
      });
    });

    if (options.stdin) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
  });
}

function formatMeta(result: ProcessResult) {
  return `${Math.max(1, result.durationMs)} ms | backend runtime`;
}

async function runPython(source: string, stdin: string) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "dsa-buddy-py-"));
  const scriptPath = path.join(tempDir, "main.py");

  try {
    await writeFile(scriptPath, createPythonSource(source), "utf8");
    const result = await runProcess({
      command: "python3",
      args: [scriptPath],
      stdin,
      cwd: tempDir,
    });

    if (result.timedOut) {
      return {
        ok: false,
        status: 408,
        stdout: "",
        stderr: "Python execution timed out after 8 seconds.",
        meta: formatMeta(result),
      };
    }

    return {
      ok: result.code === 0,
      status: result.code === 0 ? 200 : 400,
      stdout:
        result.stdout.trim() || "Program finished successfully with no stdout.",
      stderr: result.stderr.trim(),
      meta: formatMeta(result),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function extractJavaClassName(source: string) {
  const publicClassMatch = source.match(
    /public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/,
  );
  if (publicClassMatch) return publicClassMatch[1];

  const classMatch = source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return classMatch?.[1] || "Main";
}

async function runJava(source: string, stdin: string) {
  const hasJava = await commandExists("java");
  const hasJavac = await commandExists("javac");

  if (!hasJava || !hasJavac) {
    return {
      ok: false,
      status: 503,
      stdout: "",
      stderr: "Java runtime is not installed on this machine yet.",
      meta: "Java unavailable",
    };
  }

  const versionCheck = await runProcess({
    command: "java",
    args: ["-version"],
  });

  if (versionCheck.code !== 0) {
    return {
      ok: false,
      status: 503,
      stdout: "",
      stderr:
        versionCheck.stderr.trim() ||
        "Java runtime is not available on this machine yet.",
      meta: "Java unavailable",
    };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "dsa-buddy-java-"));
  const className = extractJavaClassName(source);
  const sourcePath = path.join(tempDir, `${className}.java`);

  try {
    await writeFile(sourcePath, source, "utf8");

    const compileResult = await runProcess({
      command: "javac",
      args: [sourcePath],
      cwd: tempDir,
    });

    if (compileResult.code !== 0) {
      return {
        ok: false,
        status: 400,
        stdout: "",
        stderr:
          compileResult.stderr.trim() || "Java compilation failed.",
        meta: formatMeta(compileResult),
      };
    }

    const runResult = await runProcess({
      command: "java",
      args: ["-cp", tempDir, className],
      stdin,
      cwd: tempDir,
    });

    if (runResult.timedOut) {
      return {
        ok: false,
        status: 408,
        stdout: "",
        stderr: "Java execution timed out after 8 seconds.",
        meta: formatMeta(runResult),
      };
    }

    return {
      ok: runResult.code === 0,
      status: runResult.code === 0 ? 200 : 400,
      stdout:
        runResult.stdout.trim() || "Program finished successfully with no stdout.",
      stderr: runResult.stderr.trim(),
      meta: formatMeta(runResult),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequestBody;
    const language = body.language;
    const source = body.source || "";
    const stdin = body.stdin || "";

    if (!language || !source.trim()) {
      return NextResponse.json(
        {
          error: "Missing language or source",
        },
        { status: 400 },
      );
    }

    if (language === "python") {
      if (!(await commandExists("python3"))) {
        return NextResponse.json(
          {
            ok: false,
            stdout: "",
            stderr: "Python 3 is not installed on this machine yet.",
            meta: "Python unavailable",
          },
          { status: 503 },
        );
      }

      const result = await runPython(source, stdin);
      return NextResponse.json(result, { status: result.status });
    }

    if (language === "java") {
      const result = await runJava(source, stdin);
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json(
      {
        ok: false,
        stdout: "",
        stderr: `Backend execution is not configured for ${language}.`,
        meta: "Runtime unavailable",
      },
      { status: 400 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        stdout: "",
        stderr: error?.message || "Unexpected execution failure.",
        meta: "Execution error",
      },
      { status: 500 },
    );
  }
}
