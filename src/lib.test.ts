import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  looksLikePortuguese,
  injectIntoBashRc,
  removeFromBashRc,
  generateBashFunction,
  MARKER_START,
  MARKER_END,
} from "./lib.js";

// ─── looksLikePortuguese ──────────────────────────────────────────────────────

describe("looksLikePortuguese", () => {
  it("detects clear Portuguese sentences", () => {
    assert.equal(looksLikePortuguese("crie um arquivo de configuração"), true);
    assert.equal(looksLikePortuguese("adicionar validação de email no formulário"), true);
    assert.equal(looksLikePortuguese("como fazer para remover esse bug?"), true);
    assert.equal(looksLikePortuguese("você pode verificar o código?"), true);
  });

  it("detects Portuguese with accented characters", () => {
    assert.equal(looksLikePortuguese("criação de conexão com banco"), true);
    assert.equal(looksLikePortuguese("configuração de autenticação"), true);
  });

  it("does not flag plain English", () => {
    assert.equal(looksLikePortuguese("create a new config file"), false);
    assert.equal(looksLikePortuguese("fix the authentication bug"), false);
    assert.equal(looksLikePortuguese("add error handling to the API"), false);
  });

  it("does not flag code snippets", () => {
    assert.equal(looksLikePortuguese("npm run build"), false);
    assert.equal(looksLikePortuguese("git commit -m 'fix'"), false);
    assert.equal(looksLikePortuguese("const x = 1"), false);
  });

  it("ignores very short text", () => {
    assert.equal(looksLikePortuguese(""), false);
    assert.equal(looksLikePortuguese("  "), false);
    assert.equal(looksLikePortuguese("ok"), false);
  });

  it("borderline: single PT word does not trigger (needs ≥2 matches)", () => {
    // "para" matches one pattern, no other PT markers
    assert.equal(looksLikePortuguese("para"), false);
  });
});

// ─── injectIntoBashRc / removeFromBashRc ─────────────────────────────────────

describe("injectIntoBashRc", () => {
  function tmpFile(content = ""): string {
    const p = path.join(os.tmpdir(), `test_rc_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    if (content) { fs.writeFileSync(p, content, "utf8"); }
    return p;
  }

  it("injects into empty file", () => {
    const p = tmpFile();
    injectIntoBashRc("INJECTED_CONTENT", p);
    const result = fs.readFileSync(p, "utf8");
    assert.ok(result.includes("INJECTED_CONTENT"));
    fs.unlinkSync(p);
  });

  it("appends after existing content", () => {
    const p = tmpFile("existing content\n");
    injectIntoBashRc("NEW_BLOCK", p);
    const result = fs.readFileSync(p, "utf8");
    assert.ok(result.startsWith("existing content"));
    assert.ok(result.includes("NEW_BLOCK"));
    fs.unlinkSync(p);
  });

  it("replaces existing injection block without duplication", () => {
    const first = `${MARKER_START}\nOLD\n${MARKER_END}\n`;
    const p = tmpFile(`preamble\n${first}`);
    injectIntoBashRc(`${MARKER_START}\nNEW\n${MARKER_END}\n`, p);
    const result = fs.readFileSync(p, "utf8");
    assert.ok(!result.includes("OLD"), "old block should be removed");
    assert.ok(result.includes("NEW"), "new block should be present");
    const occurrences = result.split(MARKER_START).length - 1;
    assert.equal(occurrences, 1, "only one marker");
    fs.unlinkSync(p);
  });

  it("creates file if it does not exist", () => {
    const p = path.join(os.tmpdir(), `nonexistent_${Date.now()}`);
    injectIntoBashRc("BLOCK", p);
    assert.ok(fs.existsSync(p));
    fs.unlinkSync(p);
  });
});

describe("removeFromBashRc", () => {
  function tmpFile(content = ""): string {
    const p = path.join(os.tmpdir(), `test_rc_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(p, content, "utf8");
    return p;
  }

  it("removes injected block, preserves surrounding content", () => {
    const p = tmpFile(`before\n${MARKER_START}\nINJECTED\n${MARKER_END}\nafter\n`);
    removeFromBashRc(p);
    const result = fs.readFileSync(p, "utf8");
    assert.ok(result.includes("before"));
    assert.ok(result.includes("after"));
    assert.ok(!result.includes("INJECTED"));
    assert.ok(!result.includes(MARKER_START));
    fs.unlinkSync(p);
  });

  it("does nothing if no block present", () => {
    const p = tmpFile("no injection here\n");
    removeFromBashRc(p);
    assert.equal(fs.readFileSync(p, "utf8"), "no injection here\n");
    fs.unlinkSync(p);
  });

  it("is idempotent: safe to call twice", () => {
    const p = tmpFile(`${MARKER_START}\nX\n${MARKER_END}\n`);
    removeFromBashRc(p);
    removeFromBashRc(p);
    assert.ok(!fs.readFileSync(p, "utf8").includes(MARKER_START));
    fs.unlinkSync(p);
  });

  it("silently ignores missing file", () => {
    assert.doesNotThrow(() => removeFromBashRc("/tmp/does_not_exist_xyz_abc"));
  });
});

// ─── generateBashFunction ─────────────────────────────────────────────────────

describe("generateBashFunction", () => {
  it("contains required bash functions", () => {
    const out = generateBashFunction("http://localhost:5000", "");
    assert.ok(out.includes("__claude_pt_translate"));
    assert.ok(out.includes("__claude_pt_looks_portuguese"));
    assert.ok(out.includes("claude()"));
    assert.ok(out.includes("export -f claude"));
  });

  it("embeds LibreTranslate URL", () => {
    const out = generateBashFunction("http://localhost:5000", "");
    assert.ok(out.includes("http://localhost:5000/translate"));
  });

  it("embeds API key when provided", () => {
    const out = generateBashFunction("https://libretranslate.com", "mykey123");
    assert.ok(out.includes("mykey123"));
  });

  it("omits api_key param when key is empty", () => {
    const out = generateBashFunction("https://libretranslate.com", "");
    assert.ok(!out.includes("api_key"));
  });

  it("wraps with correct markers", () => {
    const out = generateBashFunction("http://localhost:5000", "");
    assert.ok(out.includes(MARKER_START));
    assert.ok(out.includes(MARKER_END));
  });
});
