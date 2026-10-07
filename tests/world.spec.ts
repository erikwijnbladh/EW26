import { expect, test } from "@playwright/test";

test("the island renders and all five sections are navigable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/erik-world-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /01 The human/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("I'm Erik.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next stop" }).click();
  await expect(
    page.getByRole("heading", { name: "The workstation." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Compileit/ })).toBeVisible();
  await page.getByRole("button", { name: "Next stop" }).click();
  await expect(
    page.getByRole("heading", { name: "Heavy rotation." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next stop" }).click();
  const original = await page.locator(".world-photo img").getAttribute("alt");
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.locator(".world-photo img")).not.toHaveAttribute(
    "alt",
    original!,
  );
  await page.getByRole("button", { name: "Next stop" }).click();
  await expect(page.getByRole("heading", { name: "Say hello." })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "hello@erikwijnbladh.com" }),
  ).toHaveAttribute("href", "mailto:hello@erikwijnbladh.com");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("5 / 5 EXPLORED")).toBeVisible();
  await page.getByRole("button", { name: "Switch to nighttime" }).click();
  await expect(page.locator(".little-world")).toHaveAttribute(
    "data-night",
    "true",
  );
  await page.screenshot({ path: "/tmp/erik-world-night.png", fullPage: true });
  await page.getByRole("button", { name: "Reset camera" }).click();
  expect(errors).toEqual([]);
});

test("mobile and reduced motion preserve navigation and focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.screenshot({ path: "/tmp/erik-world-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const trigger = page.getByRole("button", { name: /02 The workstation/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("link", { name: "Reading mode" }).click();
  await expect(page).toHaveURL(/classic/);
  await expect(page.getByText("I'm Erik.", { exact: true })).toBeVisible();
});

test("the portfolio stays usable without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText(
    "The island is taking a break.",
  );
  await page.getByRole("button", { name: /02 The workstation/ }).click();
  await expect(page.getByRole("link", { name: /Compileit/ })).toBeVisible();
});

test("objects are clickable and context loss keeps content reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.mouse.click(735, 350);
  await expect(
    page.getByRole("heading", { name: "The workstation." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .locator(".world-canvas canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.getByRole("status")).toContainText(
    "The island is taking a break.",
  );
  await page.getByRole("button", { name: /05 Say hello/ }).click();
  await expect(page.getByRole("heading", { name: "Say hello." })).toBeVisible();
});

test("contact sends the existing payload and renders API errors", async ({
  page,
}) => {
  let payload: unknown;
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Please try again later." }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /05 Say hello/ }).click();
  await page.getByPlaceholder("Your name").fill("Portfolio test");
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.locator("textarea").fill("Testing the new portfolio form.");
  await page.getByRole("button", { name: /Send/ }).click();
  await expect(page.getByText("Please try again later.")).toBeVisible();
  expect(payload).toEqual({
    name: "Portfolio test",
    email: "test@example.com",
    message: "Testing the new portfolio form.",
  });
  await page.screenshot({ path: "/tmp/erik-world-contact.png" });
});

test("opening the record player fetches and displays current listening", async ({
  page,
}) => {
  await page.route("**/api/playing", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        current: { title: "Browser test track", artist: "Test artist" },
        playing: true,
        history: [],
      }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /03 Heavy rotation/ }).click();
  await expect(
    page.getByText("Browser test track", { exact: true }),
  ).toBeVisible();
});
