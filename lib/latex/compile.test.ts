import assert from "node:assert/strict";
import test from "node:test";
import zlib from "node:zlib";
import { countPdfPages } from "./compile.ts";

test("countPdfPages reads /Count from an uncompressed page tree", () => {
  const pdf = Buffer.from(
    "%PDF-1.5\n1 0 obj\n<< /Type /Pages /Kids [2 0 R 3 0 R] /Count 2 >>\nendobj\ntrailer",
    "latin1"
  );
  assert.equal(countPdfPages(pdf), 2);
});

test("countPdfPages reads the page tree inside a FlateDecode object stream", () => {
  const objects = "<< /Type /Pages /Kids [4 0 R] /Count 1 >> << /Type /Page >>";
  const deflated = zlib.deflateSync(Buffer.from(objects, "latin1"));
  const pdf = Buffer.concat([
    Buffer.from(
      "%PDF-1.5\n5 0 obj\n<< /Type /ObjStm /Filter /FlateDecode >>\nstream\n",
      "latin1"
    ),
    deflated,
    Buffer.from("\nendstream\nendobj\ntrailer", "latin1"),
  ]);
  assert.equal(countPdfPages(pdf), 1);
});

test("countPdfPages falls back to counting /Type /Page objects", () => {
  const pdf = Buffer.from(
    "%PDF-1.5\n<< /Type /Page >>\n<< /Type /Page >>\n<< /Type /Page >>\ntrailer",
    "latin1"
  );
  assert.equal(countPdfPages(pdf), 3);
});

test("countPdfPages throws when no page information is found", () => {
  assert.throws(() => countPdfPages(Buffer.from("not a pdf", "latin1")));
});
