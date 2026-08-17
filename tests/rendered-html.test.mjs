import assert from "node:assert/strict";
import test from "node:test";

const appRoutes = ["/", "/my-asset", "/goals", "/reports"];
const expectedTitle = /<title>钱景｜攀登财富之巅<\/title>/;

async function getWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function render(worker, pathname) {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("serves every MoneyVista application page", async () => {
  const worker = await getWorker();

  for (const pathname of appRoutes) {
    const response = await render(worker, pathname);
    assert.equal(response.status, 200, `${pathname} should return 200`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const html = await response.text();
    assert.match(html, expectedTitle);
    assert.match(html, /钱景/);
  }
});

test("links the asset navigation to the non-reserved route", async () => {
  const worker = await getWorker();
  const response = await render(worker, "/");
  const html = await response.text();

  assert.match(html, /<a href="\/my-asset">资产<\/a>/);
  assert.doesNotMatch(html, /<a href="\/assets">资产<\/a>/);
});
